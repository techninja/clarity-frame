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

    // Load image with crop-to-fill scaling
    SDL_Surface* imageSurface = IMG_Load("../photos/test.jpg");
    SDL_Texture* imageTexture = nullptr;
    
    if (imageSurface) {
        std::cout << "Image loaded: " << imageSurface->w << "x" << imageSurface->h << std::endl;
        
        // Scale to display resolution (crop to fill)
        SDL_Surface* scaledSurface = SDL_CreateRGBSurface(0, displayMode.w, displayMode.h, 32, 0, 0, 0, 0);
        
        // Calculate crop rectangle to maintain aspect ratio
        float imgAspect = (float)imageSurface->w / imageSurface->h;
        float dispAspect = (float)displayMode.w / displayMode.h;
        
        SDL_Rect srcRect;
        if (imgAspect > dispAspect) {
            // Image is wider - crop sides
            int cropW = (int)(imageSurface->h * dispAspect);
            srcRect = {(imageSurface->w - cropW) / 2, 0, cropW, imageSurface->h};
        } else {
            // Image is taller - crop top/bottom
            int cropH = (int)(imageSurface->w / dispAspect);
            srcRect = {0, (imageSurface->h - cropH) / 2, imageSurface->w, cropH};
        }
        
        SDL_BlitScaled(imageSurface, &srcRect, scaledSurface, nullptr);
        SDL_FreeSurface(imageSurface);
        
        imageTexture = SDL_CreateTextureFromSurface(renderer, scaledSurface);
        SDL_FreeSurface(scaledSurface);
        
        if (imageTexture) {
            std::cout << "Texture created at display resolution" << std::endl;
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
            SDL_RenderCopy(renderer, imageTexture, nullptr, nullptr);
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