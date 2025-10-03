#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <iostream>
#include <cstdlib>

int main() {
    // Try different video drivers in order of preference
    const char* drivers[] = {"kmsdrm", "directfb", "x11", nullptr};
    
    for (int i = 0; drivers[i]; i++) {
        setenv("SDL_VIDEODRIVER", drivers[i], 1);
        std::cout << "Trying driver: " << drivers[i] << std::endl;
        
        if (SDL_Init(SDL_INIT_VIDEO) == 0) {
            std::cout << "Success with driver: " << drivers[i] << std::endl;
            break;
        } else {
            std::cout << "Failed: " << SDL_GetError() << std::endl;
            SDL_Quit();
        }
    }

    if (!(IMG_Init(IMG_INIT_JPG | IMG_INIT_PNG))) {
        std::cerr << "SDL_image init failed: " << IMG_GetError() << std::endl;
        SDL_Quit();
        return 1;
    }

    SDL_DisplayMode displayMode;
    SDL_GetDesktopDisplayMode(0, &displayMode);
    std::cout << "Display: " << displayMode.w << "x" << displayMode.h << std::endl;

    SDL_Window* window = SDL_CreateWindow("Clarity Frame",
        0, 0, displayMode.w, displayMode.h, SDL_WINDOW_FULLSCREEN);
    
    if (!window) {
        std::cerr << "Window creation failed: " << SDL_GetError() << std::endl;
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    SDL_Renderer* renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);
    if (!renderer) {
        std::cerr << "Hardware renderer failed, trying software: " << SDL_GetError() << std::endl;
        renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_SOFTWARE);
    }
    
    if (!renderer) {
        std::cerr << "Renderer creation failed: " << SDL_GetError() << std::endl;
        SDL_DestroyWindow(window);
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    // Test with solid color first
    std::cout << "Rendering test..." << std::endl;
    
    for (int i = 0; i < 300; i++) {
        SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);
        SDL_RenderClear(renderer);
        SDL_RenderPresent(renderer);
        SDL_Delay(16);
        
        if (i % 60 == 0) {
            std::cout << "Frame " << i << std::endl;
        }
    }

    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    IMG_Quit();
    SDL_Quit();

    return 0;
}