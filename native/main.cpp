#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <iostream>

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

    // Get highest resolution display mode
    SDL_DisplayMode displayMode;
    if (SDL_GetDesktopDisplayMode(0, &displayMode) != 0) {
        std::cerr << "Failed to get display mode: " << SDL_GetError() << std::endl;
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    SDL_Window* window = SDL_CreateWindow("Clarity Frame",
        SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED,
        displayMode.w, displayMode.h, SDL_WINDOW_FULLSCREEN_DESKTOP);
    
    if (!window) {
        std::cerr << "Window creation failed: " << SDL_GetError() << std::endl;
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    SDL_Renderer* renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
    if (!renderer) {
        std::cerr << "Renderer creation failed: " << SDL_GetError() << std::endl;
        SDL_DestroyWindow(window);
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    // Load test image
    SDL_Surface* originalSurface = IMG_Load("../photos/test.jpg");
    if (!originalSurface) {
        std::cerr << "Image load failed: " << IMG_GetError() << std::endl;
        SDL_DestroyRenderer(renderer);
        SDL_DestroyWindow(window);
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    // Scale image to fit display while maintaining aspect ratio
    int imgW = originalSurface->w;
    int imgH = originalSurface->h;
    int dispW = displayMode.w;
    int dispH = displayMode.h;
    
    float scaleX = (float)dispW / imgW;
    float scaleY = (float)dispH / imgH;
    float scale = (scaleX < scaleY) ? scaleX : scaleY;
    
    int newW = (int)(imgW * scale);
    int newH = (int)(imgH * scale);
    
    SDL_Surface* scaledSurface = SDL_CreateRGBSurface(0, newW, newH, 32, 0, 0, 0, 0);
    SDL_BlitScaled(originalSurface, nullptr, scaledSurface, nullptr);
    SDL_FreeSurface(originalSurface);

    // Create tiled textures for large images
    const int tileSize = 2048;
    int tilesX = (newW + tileSize - 1) / tileSize;
    int tilesY = (newH + tileSize - 1) / tileSize;
    
    SDL_Texture* tiles[4] = {nullptr}; // Support up to 2x2 tiles
    SDL_Rect tileRects[4];
    int tileCount = 0;
    
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
        }
    }
    
    SDL_FreeSurface(scaledSurface);

    if (tileCount == 0) {
        std::cerr << "No tiles created" << std::endl;
        SDL_DestroyRenderer(renderer);
        SDL_DestroyWindow(window);
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    // Fade in animation
    Uint32 startTime = SDL_GetTicks();
    const Uint32 fadeDuration = 2000; // 2 seconds
    bool running = true;
    SDL_Event event;

    while (running) {
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT || event.type == SDL_KEYDOWN) {
                running = false;
            }
        }

        Uint32 currentTime = SDL_GetTicks();
        Uint32 elapsed = currentTime - startTime;
        
        // Calculate fade alpha (0-255)
        Uint8 alpha = (elapsed >= fadeDuration) ? 255 : (255 * elapsed) / fadeDuration;

        // Clear to black
        SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
        SDL_RenderClear(renderer);

        // Render all tiles
        for (int i = 0; i < tileCount; i++) {
            SDL_SetTextureAlphaMod(tiles[i], alpha);
            SDL_RenderCopy(renderer, tiles[i], nullptr, &tileRects[i]);
        }

        SDL_RenderPresent(renderer);
        SDL_Delay(16); // ~60 FPS
    }

    for (int i = 0; i < tileCount; i++) {
        if (tiles[i]) SDL_DestroyTexture(tiles[i]);
    }
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    IMG_Quit();
    SDL_Quit();

    return 0;
}