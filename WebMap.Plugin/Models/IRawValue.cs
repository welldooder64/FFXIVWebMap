namespace WebMap.Models;

public interface IRawValue<out T> where T : struct
{
    // ReSharper disable once UnusedMember.Global
    T RawValue { get; }
}
