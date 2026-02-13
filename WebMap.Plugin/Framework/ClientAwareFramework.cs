using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Dalamud.Plugin.Services;
using WebMap.Networking;

namespace WebMap.Framework;

/// <summary>
/// A wrapper around IFramework that only dispatches Update events when clients are connected.
/// </summary>
public sealed class ClientAwareFramework : IFramework, IDisposable
{
    private readonly IFramework framework;
    private readonly INetworkService networkService;
    private readonly Lock syncLock = new();
    
    private readonly HashSet<IFramework.OnUpdateDelegate> handlers = [];
    private int clientCount;

    public ClientAwareFramework(IFramework framework, INetworkService networkService)
    {
        this.framework = framework;
        this.networkService = networkService;
        
        networkService.OnClientConnected += OnClientConnected;
        networkService.OnClientDisconnected += OnClientDisconnected;
    }
    
    public event IFramework.OnUpdateDelegate? Update
    {
        add
        {
            if (value == null) return;
            lock (syncLock)
            {
                handlers.Add(value);
                if (clientCount > 0)
                {
                    framework.Update += value;
                }
            }
        }
        remove
        {
            if (value == null) return;
            lock (syncLock)
            {
                handlers.Remove(value);
                if (handlers.Count == 0)
                {
                    framework.Update -= value;
                }
            }
        }
    }

    private void OnClientConnected(INetworkService service, INetworkClient client)
    {
        lock (syncLock)
        {
            clientCount++;
            if (clientCount == 1)
            {
                foreach (var handler in handlers)
                    framework.Update += handler;
            }
        }
    }

    private void OnClientDisconnected(INetworkService service, INetworkClient client)
    {
        lock (syncLock)
        {
            clientCount = Math.Max(0, clientCount - 1);
            if (clientCount == 0)
            {
                foreach (var handler in handlers)
                    framework.Update -= handler;
            }
        }
    }

    #region IFramework Forwarding

    public DateTime LastUpdate => framework.LastUpdate;
    public DateTime LastUpdateUTC => framework.LastUpdateUTC;
    public TimeSpan UpdateDelta => framework.UpdateDelta;
    public bool IsInFrameworkUpdateThread => framework.IsInFrameworkUpdateThread;
    public bool IsFrameworkUnloading => framework.IsFrameworkUnloading;
    
    public TaskFactory GetTaskFactory() => framework.GetTaskFactory();
    public Task DelayTicks(long numTicks, CancellationToken cancellationToken = default) => framework.DelayTicks(numTicks, cancellationToken);
    public Task Run(Action action, CancellationToken cancellationToken = default) => framework.Run(action, cancellationToken);
    public Task<T> Run<T>(Func<T> action, CancellationToken cancellationToken = default) => framework.Run(action, cancellationToken);
    public Task Run(Func<Task> action, CancellationToken cancellationToken = default) => framework.Run(action, cancellationToken);
    public Task<T> Run<T>(Func<Task<T>> action, CancellationToken cancellationToken = default) => framework.Run(action, cancellationToken);
    public Task<T> RunOnFrameworkThread<T>(Func<T> func) => framework.RunOnFrameworkThread(func);
    public Task RunOnFrameworkThread(Action action) => framework.RunOnFrameworkThread(action);
    [Obsolete($"Use {nameof(RunOnTick)} instead.")]
    public Task<T> RunOnFrameworkThread<T>(Func<Task<T>> func) => framework.RunOnFrameworkThread(func);
    [Obsolete($"Use {nameof(RunOnTick)} instead.")]
    public Task RunOnFrameworkThread(Func<Task> func) => framework.RunOnFrameworkThread(func);
    public Task<T> RunOnTick<T>(Func<T> func, TimeSpan delay = default, int delayTicks = 0, CancellationToken cancellationToken = default) => framework.RunOnTick(func, delay, delayTicks, cancellationToken);
    public Task RunOnTick(Action action, TimeSpan delay = default, int delayTicks = 0, CancellationToken cancellationToken = default) => framework.RunOnTick(action, delay, delayTicks, cancellationToken);
    public Task<T> RunOnTick<T>(Func<Task<T>> func, TimeSpan delay = default, int delayTicks = 0, CancellationToken cancellationToken = default) => framework.RunOnTick(func, delay, delayTicks, cancellationToken);
    public Task RunOnTick(Func<Task> func, TimeSpan delay = default, int delayTicks = 0, CancellationToken cancellationToken = default) => framework.RunOnTick(func, delay, delayTicks, cancellationToken);
    
    #endregion

    public void Dispose()
    {
        networkService.OnClientConnected -= OnClientConnected;
        networkService.OnClientDisconnected -= OnClientDisconnected;
        
        lock (syncLock)
        {
            if (clientCount > 0)
            {
                foreach (var handler in handlers)
                    framework.Update -= handler;
            }
            handlers.Clear();
        }
    }
}
