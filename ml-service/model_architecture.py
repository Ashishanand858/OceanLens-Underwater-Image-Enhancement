"""Exact model classes from notebook cells 16 and 18. Do not change for this checkpoint."""
import torch
import torch.nn as nn

class PixelMambaBlock(nn.Module):
    def __init__(self, dim):
        super().__init__()

        self.norm = nn.LayerNorm(dim)

        self.forward_mixer = nn.Sequential(
            nn.Linear(dim, dim),
            nn.GELU(),
            nn.Linear(dim, dim)
        )

        self.backward_mixer = nn.Sequential(
            nn.Linear(dim, dim),
            nn.GELU(),
            nn.Linear(dim, dim)
        )

        self.gate = nn.Sequential(
            nn.Linear(dim, dim),
            nn.Sigmoid()
        )

    def forward(self, x):
        B, C, H, W = x.shape

        x_seq = x.view(B, C, -1).permute(0, 2, 1)
        x_norm = self.norm(x_seq)

        fwd = self.forward_mixer(x_norm)

        bwd = torch.flip(x_norm, dims=[1])
        bwd = self.backward_mixer(bwd)
        bwd = torch.flip(bwd, dims=[1])

        combined = fwd + bwd

        gate = self.gate(x_norm)
        out = gate * combined + (1 - gate) * x_seq

        out = out.permute(0, 2, 1).view(B, C, H, W)

        return out


class PIXMambaNet(nn.Module):
    def __init__(self):
        super().__init__()

        self.enc1 = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1),
            nn.ReLU()
        )

        self.enc2 = nn.Sequential(
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU()
        )

        self.pixmamba1 = PixelMambaBlock(64)
        self.pixmamba2 = PixelMambaBlock(64)

        self.dec1 = nn.Sequential(
            nn.Conv2d(64, 32, 3, padding=1),
            nn.ReLU()
        )

        self.dec2 = nn.Sequential(
            nn.Conv2d(32, 3, 3, padding=1),
            nn.Sigmoid()
        )

    def forward(self, x):
        x1 = self.enc1(x)
        x2 = self.enc2(x1)

        x3 = self.pixmamba1(x2)
        x4 = self.pixmamba2(x3)

        x5 = self.dec1(x4)
        out = self.dec2(x5)

        return out
