using System;
using System.Threading.Tasks;
using FFXIVWebMap.Networking.Messages;

namespace FFXIVWebMap.Networking;

public interface INetworkService
{
    delegate void OnClientConnectedDelegate(INetworkService networkService, INetworkClient client);
    delegate void OnClientDisconnectedDelegate(INetworkService networkService, INetworkClient client);
    
    event OnClientConnectedDelegate? OnClientConnected;
    event OnClientDisconnectedDelegate? OnClientDisconnected;
    
    void RegisterHandler<T>(Action<INetworkService, INetworkClient, T> handler) where T : Message.IReceiveMessage;
    void UnregisterHandler<T>(Action<INetworkService, INetworkClient, T> handler) where T : Message.IReceiveMessage;
    
    Task Broadcast<T>(Message.ContentWithType<MessageType, T> message);
}
