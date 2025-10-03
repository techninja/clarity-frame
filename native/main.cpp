#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <iostream>
#include <cstdlib>

int main() {
    // Suppress Wayland proxy warnings
    setenv("WAYLAND_DISPLAY", "", 1);
    
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
        SDL_WINDOW_SHOWN | SDL_WINDOW_BORDERLESS);
    
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
    for (int i = 0; i < 300; i++) { // 5 seconds at 60fps
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