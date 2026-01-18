using System.Threading.Tasks;
using FFXIVWebMap.Networking.Messages;

namespace FFXIVWebMap.Networking;

public interface INetworkClient
{
    Task Send<T>(Message.ContentWithType<MessageType, T> message);
}
