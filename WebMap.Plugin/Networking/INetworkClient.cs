using System.Threading.Tasks;
using WebMap.Networking.Messages;
using WebMap.Networking.Models;

namespace WebMap.Networking;

public interface INetworkClient
{
    Task Send<T>(Message.ContentWithType<MessageType, T> message);
}
