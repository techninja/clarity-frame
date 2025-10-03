#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <iostream>
#include <cstdlib>

int main() {
    // Force SDL to use framebuffer instead of Wayland/X11
    setenv("SDL_VIDEODRIVER", "fbcon", 1);
    
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        std::cerr << "SDL init failed: " << SDL_GetError() << std::endl;
        return 1;
    }

    if (!(IMG_Init(IMG_INIT_JPG | IMG_INIT_PNG))) {
        std::cerr << "SDL_image init failed: " << IMG_GetError() << std::endl;
        SDL_Quit();
        return 1;
    }

    // Get display info
    SDL_DisplayMode displayMode;
    if (SDL_GetDesktopDisplayMode(0, &displayMode) != 0) {
        std::cerr << "Failed to get display mode: " << SDL_GetError() << std::endl;
        IMG_Quit();
        SDL_Quit();
        return 1;
    }
    std::cout << "Framebuffer: " << displayMode.w << "x" << displayMode.h << std::endl;

    // Create fullscreen window
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
        std::cerr << "Renderer creation failed: " << SDL_GetError() << std::endl;
        SDL_DestroyWindow(window);
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    // Load and display image
    SDL_Surface* imageSurface = IMG_Load("../photos/test.jpg");
    if (!imageSurface) {
        std::cerr << "Image load failed: " << IMG_GetError() << std::endl;
        SDL_DestroyRenderer(renderer);
        SDL_DestroyWindow(window);
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    SDL_Texture* imageTexture = SDL_CreateTextureFromSurface(renderer, imageSurface);
    SDL_FreeSurface(imageSurface);

    if (!imageTexture) {
        std::cerr << "Texture creation failed: " << SDL_GetError() << std::endl;
        SDL_DestroyRenderer(renderer);
        SDL_DestroyWindow(window);
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    std::cout << "Framebuffer rendering started..." << std::endl;

    // Simple fade in
    Uint32 startTime = SDL_GetTicks();
    const Uint32 fadeDuration = 2000;
    const Uint32 displayTime = 5000;

    while (SDL_GetTicks() - startTime < displayTime) {
        Uint32 elapsed = SDL_GetTicks() - startTime;
        Uint8 alpha = (elapsed >= fadeDuration) ? 255 : (255 * elapsed) / fadeDuration;

        SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
        SDL_RenderClear(renderer);
        
        SDL_SetTextureAlphaMod(imageTexture, alpha);
        SDL_RenderCopy(renderer, imageTexture, nullptr, nullptr);
        
        SDL_RenderPresent(renderer);
        SDL_Delay(16);
    }

    SDL_DestroyTexture(imageTexture);
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    IMG_Quit();
    SDL_Quit();

    return 0;
}