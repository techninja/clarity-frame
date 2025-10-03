#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <iostream>
#include <cstdlib>

int main() {
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        std::cerr << "SDL init failed: " << SDL_GetError() << std::endl;
        return 1;
    }

    if (!(IMG_Init(IMG_INIT_JPG | IMG_INIT_PNG))) {
        std::cerr << "SDL_image init failed: " << IMG_GetError() << std::endl;
        SDL_Quit();
        return 1;
    }

    SDL_DisplayMode displayMode;
    SDL_GetDesktopDisplayMode(0, &displayMode);
    
    SDL_Window* window = SDL_CreateWindow("Test", 
        0, 0, displayMode.w, displayMode.h, 
        SDL_WINDOW_SHOWN | SDL_WINDOW_BORDERLESS | SDL_WINDOW_ALWAYS_ON_TOP);
    
    if (!window) {
        std::cerr << "Window creation failed: " << SDL_GetError() << std::endl;
        SDL_Quit();
        return 1;
    }

    SDL_Renderer* renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_SOFTWARE);
    if (!renderer) {
        std::cerr << "Renderer creation failed: " << SDL_GetError() << std::endl;
        SDL_DestroyWindow(window);
        SDL_Quit();
        return 1;
    }

    std::cout << "Created window and renderer successfully" << std::endl;

    // Load and process image with tiling
    SDL_Surface* originalSurface = IMG_Load("../photos/test.jpg");
    SDL_Texture* tiles[4] = {nullptr, nullptr, nullptr, nullptr};
    SDL_Rect tileRects[4] = {{0,0,0,0}, {0,0,0,0}, {0,0,0,0}, {0,0,0,0}};
    int tileCount = 0;
    
    if (originalSurface) {
        std::cout << "Image loaded: " << originalSurface->w << "x" << originalSurface->h << std::endl;
        
        // Scale to fill display (crop to fit)
        int imgW = originalSurface->w;
        int imgH = originalSurface->h;
        int dispW = displayMode.w;
        int dispH = displayMode.h;
        
        float scaleX = (float)dispW / imgW;
        float scaleY = (float)dispH / imgH;
        float scale = (scaleX > scaleY) ? scaleX : scaleY; // Use larger scale to fill
        
        int newW = (int)(imgW * scale);
        int newH = (int)(imgH * scale);
        
        std::cout << "Scaling to: " << newW << "x" << newH << std::endl;
        
        SDL_Surface* scaledSurface = SDL_CreateRGBSurface(0, newW, newH, 32, 0, 0, 0, 0);
        SDL_BlitScaled(originalSurface, nullptr, scaledSurface, nullptr);
        SDL_FreeSurface(originalSurface);
        
        // Create tiled textures
        const int tileSize = 2048;
        int tilesX = (newW + tileSize - 1) / tileSize;
        int tilesY = (newH + tileSize - 1) / tileSize;
        
        for (int ty = 0; ty < tilesY && tileCount < 4; ty++) {
            for (int tx = 0; tx < tilesX && tileCount < 4; tx++) {
                int tileW = (tx == tilesX - 1) ? newW - tx * tileSize : tileSize;
                int tileH = (ty == tilesY - 1) ? newH - ty * tileSize : tileSize;
                
                SDL_Surface* tileSurface = SDL_CreateRGBSurface(0, tileW, tileH, 32, 0, 0, 0, 0);
                SDL_Rect srcRect = {tx * tileSize, ty * tileSize, tileW, tileH};
                SDL_BlitSurface(scaledSurface, &srcRect, tileSurface, nullptr);
                
                tiles[tileCount] = SDL_CreateTextureFromSurface(renderer, tileSurface);
                SDL_FreeSurface(tileSurface);
                
                tileRects[tileCount] = {(dispW - newW) / 2 + tx * tileSize, (dispH - newH) / 2 + ty * tileSize, tileW, tileH};
                tileCount++;
                std::cout << "Created tile " << tileCount << ": " << tileW << "x" << tileH << std::endl;
            }
        }
        
        SDL_FreeSurface(scaledSurface);
    } else {
        std::cout << "Image load failed: " << IMG_GetError() << std::endl;
    }

    // Render loop - image if available, red screen if not
    bool running = true;
    for (int i = 0; i < 300 && running; i++) { // 5 seconds at 60fps
        // Handle events
        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT || 
                (event.type == SDL_KEYDOWN && event.key.keysym.sym == SDLK_ESCAPE)) {
                running = false;
                break;
            }
        }
        
        if (!running) break;
        
        SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);
        SDL_RenderClear(renderer);
        
        // Render all tiles
        for (int t = 0; t < tileCount; t++) {
            if (tiles[t]) {
                SDL_RenderCopy(renderer, tiles[t], nullptr, &tileRects[t]);
            }
        }
        
        SDL_RenderPresent(renderer);
        SDL_Delay(16);
        
        if (i % 60 == 0) {
            std::cout << "Frame " << i << std::endl;
        }
    }

    std::cout << "Cleaning up..." << std::endl;
    for (int i = 0; i < tileCount; i++) {
        if (tiles[i]) SDL_DestroyTexture(tiles[i]);
    }
    SDL_DestroyRenderer(renderer);
    // Skip window destruction
    IMG_Quit();
    SDL_Quit();
    std::cout << "Done" << std::endl;
    
    return 0;
}