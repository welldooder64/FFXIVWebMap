using System.Threading.Tasks;
using WebMap.Networking.Messages;
using WebMap.Networking.Models;

namespace WebMap.Networking;

public interface INetworkService
{
    delegate void OnClientConnectedDelegate(INetworkService networkService, INetworkClient client);
    delegate void OnClientDisconnectedDelegate(INetworkService networkService, INetworkClient client);
    
    event OnClientConnectedDelegate? OnClientConnected;
    event OnClientDisconnectedDelegate? OnClientDisconnected;

    Task Broadcast<T>(Message.ContentWithType<MessageType, T> message);
}
