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

    // Try to load image
    SDL_Surface* imageSurface = IMG_Load("../photos/test.jpg");
    SDL_Texture* imageTexture = nullptr;
    
    if (imageSurface) {
        std::cout << "Image loaded: " << imageSurface->w << "x" << imageSurface->h << std::endl;
        imageTexture = SDL_CreateTextureFromSurface(renderer, imageSurface);
        SDL_FreeSurface(imageSurface);
        
        if (imageTexture) {
            std::cout << "Texture created successfully" << std::endl;
        } else {
            std::cout << "Texture creation failed: " << SDL_GetError() << std::endl;
        }
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
        
        if (imageTexture) {
            // Get texture dimensions
            int texW, texH;
            SDL_QueryTexture(imageTexture, nullptr, nullptr, &texW, &texH);
            
            if (i == 0) { // Debug output on first frame only
                std::cout << "Display: " << displayMode.w << "x" << displayMode.h << std::endl;
                std::cout << "Texture: " << texW << "x" << texH << std::endl;
            }
            
            // Scale to fit display while maintaining aspect ratio
            float scaleX = (float)displayMode.w / texW;
            float scaleY = (float)displayMode.h / texH;
            float scale = (scaleX < scaleY) ? scaleX : scaleY;
            
            int newW = (int)(texW * scale);
            int newH = (int)(texH * scale);
            
            if (i == 0) {
                std::cout << "Scale: " << scale << ", Final: " << newW << "x" << newH << std::endl;
            }
            
            // Center on screen
            SDL_Rect destRect = {
                (displayMode.w - newW) / 2,
                (displayMode.h - newH) / 2,
                newW, newH
            };
            
            SDL_RenderCopy(renderer, imageTexture, nullptr, &destRect);
        }
        
        SDL_RenderPresent(renderer);
        SDL_Delay(16);
        
        if (i % 60 == 0) {
            std::cout << "Frame " << i << std::endl;
        }
    }

    std::cout << "Cleaning up..." << std::endl;
    if (imageTexture) SDL_DestroyTexture(imageTexture);
    SDL_DestroyRenderer(renderer);
    // Skip window destruction
    IMG_Quit();
    SDL_Quit();
    std::cout << "Done" << std::endl;
    
    return 0;
}