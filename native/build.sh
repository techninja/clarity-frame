#!/bin/bash
set -e

echo "Building Clarity Frame native application..."

# Create build directory
mkdir -p build
cd build

# Configure and build
cmake ..
make -j$(nproc)

echo "Build complete. Executable: ./build/clarity-frame"