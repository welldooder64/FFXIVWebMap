using System.Numerics;

namespace WebMap.Models;

public struct PlayerTransformAndCameraRotation
{
    public required Transform PlayerTransform { get; init; }
    public required float CameraRotation { get; init; }
}

public readonly record struct Transform(Vector3 Position, float Rotation);
