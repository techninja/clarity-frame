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
        std::cout << "Frame start..." << std::endl;
        
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT) {
                running = false;
            }
            if (event.type == SDL_KEYDOWN) {
                Uint32 currentTime = SDL_GetTicks();
                if (currentTime - startTime >= minDisplayTime) {
                    running = false;
                }
            }
        }
        std::cout << "Events processed..." << std::endl;

        Uint32 currentTime = SDL_GetTicks();
        Uint32 elapsed = currentTime - startTime;
        
        // Calculate fade alpha (0-255)
        Uint8 alpha = (elapsed >= fadeDuration) ? 255 : (255 * elapsed) / fadeDuration;
        std::cout << "Alpha calculated: " << (int)alpha << std::endl;

        // Clear to black
        if (SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255) != 0) {
            std::cerr << "SetRenderDrawColor failed: " << SDL_GetError() << std::endl;
            break;
        }
        std::cout << "Draw color set..." << std::endl;
        
        if (SDL_RenderClear(renderer) != 0) {
            std::cerr << "RenderClear failed: " << SDL_GetError() << std::endl;
            break;
        }
        std::cout << "Screen cleared..." << std::endl;

        // Render all tiles
        for (int i = 0; i < tileCount; i++) {
            std::cout << "Rendering tile " << i << "..." << std::endl;
            if (tiles[i]) {
                if (SDL_SetTextureAlphaMod(tiles[i], alpha) != 0) {
                    std::cerr << "SetTextureAlphaMod failed: " << SDL_GetError() << std::endl;
                    continue;
                }
                std::cout << "Alpha set for tile " << i << "..." << std::endl;
                
                if (SDL_RenderCopy(renderer, tiles[i], nullptr, &tileRects[i]) != 0) {
                    std::cerr << "RenderCopy failed: " << SDL_GetError() << std::endl;
                    continue;
                }
                std::cout << "Tile " << i << " rendered..." << std::endl;
            }
        }

        std::cout << "About to present..." << std::endl;
        SDL_RenderPresent(renderer);
        std::cout << "Frame presented!" << std::endl;
        
        frameCount++;
        SDL_Delay(16); // ~60 FPS
        
        // Exit after first frame for debugging
        if (frameCount >= 1) {
            std::cout << "Exiting after first frame for debug" << std::endl;
            running = false;
        }
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
    
    std::cout << "Destroying window..." << std::endl;
    if (window) {
        SDL_DestroyWindow(window);
        window = nullptr;
    }
    
    std::cout << "Quitting IMG..." << std::endl;
    IMG_Quit();
    
    std::cout << "Quitting SDL..." << std::endl;
    SDL_Quit();
    
    std::cout << "Clean exit" << std::endl;
    return 0;
}