using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using EmbedIO.WebSockets;
using FFXIVWebMap.Networking.Messages;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace FFXIVWebMap.Networking.Web;

public class WebSocketHandler(string route) : WebSocketModule(route, true), INetworkService
{
    private static readonly JsonSerializerSettings Settings = new()
    {
        Converters = { new StringEnumConverter(new CamelCaseNamingStrategy()) },
        ContractResolver = new DefaultContractResolver
        {
            NamingStrategy = new CamelCaseNamingStrategy()
        }
    };
    private static readonly JsonSerializer Serializer = JsonSerializer.Create(Settings);

    private readonly ConcurrentDictionary<IWebSocketContext, WebSocketClient> clients = new();
    private readonly ConcurrentDictionary<Type, List<HandlerRegistration>> handlers = new();
    private readonly Lock handlersLock = new();
    
    private sealed class HandlerRegistration
    {
        public required Delegate Original { get; init; }
        public required Action<INetworkService, INetworkClient, JObject> Adapter { get; init; }
    }
    
    public event INetworkService.OnClientConnectedDelegate? OnClientConnected;
    public event INetworkService.OnClientDisconnectedDelegate? OnClientDisconnected;

    public void RegisterHandler<T>(Action<INetworkService, INetworkClient, T> handler) where T : Message.IReceiveMessage
    {
        var t = typeof(T);

        lock (handlersLock)
        {
            if (!handlers.TryGetValue(t, out var list))
            {
                list = new List<HandlerRegistration>();
                handlers[t] = list;
            }
            
            list.Add(new HandlerRegistration { Original = handler, Adapter = Adapter });
        }

        return;

        void Adapter(INetworkService svc, INetworkClient client, JObject json)
        {
            try
            {
                var value = json.ToObject<T>(Serializer);
                if (value is null)
                {
                    WebMap.Log.Warning("Failed to deserialize incoming message {json} to {TargetType}", json, t.Name);
                    return;
                }

                handler(svc, client, value);
            }
            catch (Exception ex)
            {
                WebMap.Log.Error(ex, "Error deserializing/invoking handler for {json} to {TargetType}", json, t.Name);
            }
        }
    }

    public void UnregisterHandler<T>(Action<INetworkService, INetworkClient, T> handler) where T : Message.IReceiveMessage
    {
        var type = typeof(T);
        
        lock (handlersLock)
        {
            if (handlers.TryGetValue(type, out var list))
            {
                for (var i = list.Count - 1; i >= 0; i--)
                {
                    var reg = list[i];
                    if (ReferenceEquals(reg.Original, handler))
                    {
                        list.RemoveAt(i);
                    }
                }
            }
        }
    }
    
    protected override Task OnMessageReceivedAsync(IWebSocketContext context, byte[] buffer, IWebSocketReceiveResult result)
    {
        try
        {
            var messageText = Encoding.UTF8.GetString(buffer);
            WebMap.Log.Debug("WebSocket received: {messageText}", messageText);

            JObject? json;
            try
            {
                json = JObject.Parse(messageText);
            }
            catch (Exception)
            {
                WebMap.Log.Warning("Received non-JSON websocket message");
                return Task.CompletedTask;
            }

            var typeToken = json["type"];
            if (typeToken == null)
            {
                WebMap.Log.Warning("Received message without type field");
                return Task.CompletedTask;
            }

            var typeStr = typeToken.Value<string>();
            if (string.IsNullOrWhiteSpace(typeStr) || !Message.IReceiveMessage.CasesByName.TryGetValue(typeStr, out var type))
            {
                WebMap.Log.Warning($"Unknown receive message type: {typeStr}");
                return Task.CompletedTask;
            }

            if (!clients.TryGetValue(context, out var client))
            {
                WebMap.Log.Warning($"Client for context {context.Id} not found when routing message");
                return Task.CompletedTask;
            }
            
            var toInvoke = new List<HandlerRegistration>();
            lock (handlersLock)
            {
                if (handlers.TryGetValue(type, out var list))
                {
                    toInvoke = new List<HandlerRegistration>(list);
                }
            }
            
            foreach (var reg in toInvoke)
            {
                try
                {
                    reg.Adapter(this, client, json);
                }
                catch (Exception ex)
                {
                    WebMap.Log.Error(ex, "Error in message handler for type {type}", type);
                }
            }
        }
        catch (Exception e)
        {
            WebMap.Log.Error(e ,"An error occured processing a websocket message");
        }
        
        return Task.CompletedTask;
    }

    protected override Task OnClientConnectedAsync(IWebSocketContext context)
    {
        WebMap.Log.Debug("WebSocket client connected from {RemoteEndPoint}", context.RemoteEndPoint);

        var client = new WebSocketClient(this, context);
        if (!clients.TryAdd(context, client))
        {
            WebMap.Log.Warning($"Failed to add client with id {context.Id} to clients list");
        }
        
        OnClientConnected?.Invoke(this, client);
        
        return Task.CompletedTask;
    }

    protected override Task OnClientDisconnectedAsync(IWebSocketContext context)
    {
        WebMap.Log.Debug("WebSocket client disconnected from {RemoteEndPoint}", context.RemoteEndPoint);

        if (clients.TryRemove(context, out var client))
        {
            OnClientDisconnected?.Invoke(this, client);

            client.Dispose();
        }
        
        return Task.CompletedTask;
    }
    
    public Task Broadcast<T>(Message.ContentWithType<MessageType, T> message)
    {
        return Task.WhenAll(clients.Values.Select<WebSocketClient, Task>(c => c.Send(Serialize(message))));
    }
    
    public Task Send(IWebSocketContext context, string message)
    {
        return SendAsync(context, message);
    }
    
    public static string Serialize<T>(Message.ContentWithType<MessageType, T> message)
    {
        return JsonConvert.SerializeObject(message, Settings);
    }
    
    public new void Dispose()
    {
        foreach (var client in clients.Values)
        {
            client.Dispose();
        }
        
        clients.Clear();
        base.Dispose();
    }
}
