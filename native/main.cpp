#include <SDL2/SDL.h>
#include <iostream>

int main() {
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        std::cerr << "SDL init failed: " << SDL_GetError() << std::endl;
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

    // Simple render loop - just red screen
    for (int i = 0; i < 300; i++) { // 5 seconds at 60fps
        SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);
        SDL_RenderClear(renderer);
        SDL_RenderPresent(renderer);
        SDL_Delay(16);
        
        if (i % 60 == 0) {
            std::cout << "Frame " << i << std::endl;
        }
    }

    std::cout << "Cleaning up..." << std::endl;
    SDL_DestroyRenderer(renderer);
    // Skip window destruction
    SDL_Quit();
    std::cout << "Done" << std::endl;
    
    return 0;
}