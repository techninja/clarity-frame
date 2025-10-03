#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <iostream>
#include <signal.h>

void segfault_handler(int sig) {
    std::cerr << "SEGFAULT: Signal " << sig << " caught!" << std::endl;
    SDL_Quit();
    exit(1);
}

int main() {
    signal(SIGSEGV, segfault_handler);
    std::cout << "Starting Clarity Frame..." << std::endl;
    
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
    std::cout << "Display: " << displayMode.w << "x" << displayMode.h << std::endl;

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
    std::cout << "Loading image..." << std::endl;
    SDL_Surface* originalSurface = IMG_Load("../photos/test.jpg");
    if (!originalSurface) {
        std::cerr << "Image load failed: " << IMG_GetError() << std::endl;
        SDL_DestroyRenderer(renderer);
        SDL_DestroyWindow(window);
        IMG_Quit();
        SDL_Quit();
        return 1;
    }
    std::cout << "Image loaded: " << originalSurface->w << "x" << originalSurface->h << std::endl;

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
    
    std::cout << "Scaling to: " << newW << "x" << newH << std::endl;
    SDL_Surface* scaledSurface = SDL_CreateRGBSurface(0, newW, newH, 32, 0, 0, 0, 0);
    if (!scaledSurface) {
        std::cerr << "Failed to create scaled surface: " << SDL_GetError() << std::endl;
        SDL_FreeSurface(originalSurface);
        SDL_DestroyRenderer(renderer);
        SDL_DestroyWindow(window);
        IMG_Quit();
        SDL_Quit();
        return 1;
    }
    SDL_BlitScaled(originalSurface, nullptr, scaledSurface, nullptr);
    SDL_FreeSurface(originalSurface);

    // Create tiled textures for large images
    const int tileSize = 2048;
    int tilesX = (newW + tileSize - 1) / tileSize;
    int tilesY = (newH + tileSize - 1) / tileSize;
    
    SDL_Texture* tiles[4] = {nullptr, nullptr, nullptr, nullptr};
    SDL_Rect tileRects[4] = {{0,0,0,0}, {0,0,0,0}, {0,0,0,0}, {0,0,0,0}};
    int tileCount = 0;
    
    for (int ty = 0; ty < tilesY && tileCount < 4; ty++) {
        for (int tx = 0; tx < tilesX && tileCount < 4; tx++) {
            int tileW = (tx == tilesX - 1) ? newW - tx * tileSize : tileSize;
            int tileH = (ty == tilesY - 1) ? newH - ty * tileSize : tileSize;
            
            SDL_Surface* tileSurface = SDL_CreateRGBSurface(0, tileW, tileH, 32, 0, 0, 0, 0);
            
            SDL_Rect srcRect = {tx * tileSize, ty * tileSize, tileW, tileH};
            SDL_BlitSurface(scaledSurface, &srcRect, tileSurface, nullptr);
            
            tiles[tileCount] = SDL_CreateTextureFromSurface(renderer, tileSurface);
            if (!tiles[tileCount]) {
                std::cerr << "Failed to create tile texture: " << SDL_GetError() << std::endl;
                SDL_FreeSurface(tileSurface);
                continue;
            }
            SDL_FreeSurface(tileSurface);
            
            tileRects[tileCount] = {(dispW - newW) / 2 + tx * tileSize, (dispH - newH) / 2 + ty * tileSize, tileW, tileH};
            tileCount++;
            std::cout << "Created tile " << tileCount << ": " << tileW << "x" << tileH << std::endl;
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

    std::cout << "Starting render loop with " << tileCount << " tiles..." << std::endl;
    
    // Fade in animation
    Uint32 startTime = SDL_GetTicks();
    const Uint32 fadeDuration = 2000; // 2 seconds
    const Uint32 minDisplayTime = 5000; // 5 seconds minimum
    bool running = true;
    SDL_Event event;
    int frameCount = 0;

    while (running) {
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT || event.type == SDL_KEYDOWN) {
                running = false;
            }
        }

        Uint32 currentTime = SDL_GetTicks();
        Uint32 elapsed = currentTime - startTime;
        
        // Exit after minimum time
        if (elapsed >= minDisplayTime) {
            running = false;
            continue;
        }
        
        // Calculate fade alpha (0-255)
        Uint8 alpha = (elapsed >= fadeDuration) ? 255 : (255 * elapsed) / fadeDuration;

        // Clear and render
        SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
        SDL_RenderClear(renderer);

        // Render tiles with bounds checking
        for (int i = 0; i < tileCount && i < 4; i++) {
            if (tiles[i] && tileRects[i].w > 0 && tileRects[i].h > 0) {
                SDL_SetTextureAlphaMod(tiles[i], alpha);
                SDL_RenderCopy(renderer, tiles[i], nullptr, &tileRects[i]);
            }
        }

        SDL_RenderPresent(renderer);
        SDL_Delay(16);
    }
    
    std::cout << "Exiting render loop..." << std::endl;

    std::cout << "Destroying textures..." << std::endl;
    for (int i = 0; i < tileCount; i++) {
        if (tiles[i]) {
            std::cout << "Destroying tile " << i << std::endl;
            SDL_DestroyTexture(tiles[i]);
            tiles[i] = nullptr;
        }
    }
    
    std::cout << "Destroying renderer..." << std::endl;
    if (renderer) {
        SDL_DestroyRenderer(renderer);
        renderer = nullptr;
    }
    
    std::cout << "Skipping window destruction (Wayland issue)..." << std::endl;
    // Skip SDL_DestroyWindow - causes segfault on Wayland
    
    std::cout << "Quitting IMG..." << std::endl;
    IMG_Quit();
    
    std::cout << "Quitting SDL..." << std::endl;
    SDL_Quit();
    
    std::cout << "Clean exit" << std::endl;
    return 0;
}