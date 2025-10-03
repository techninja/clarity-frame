#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <iostream>
#include <signal.h>

void segfault_handler(int sig) {
    std::cerr << "SEGFAULT at signal " << sig << std::endl;
    SDL_Quit();
    exit(1);
}

int main() {
    signal(SIGSEGV, segfault_handler);
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
    std::cout << "Display: " << displayMode.w << "x" << displayMode.h << std::endl;

    // Borderless window at full resolution - kiosk mode
    SDL_Window* window = SDL_CreateWindow("Clarity Frame",
        0, 0, displayMode.w, displayMode.h, 
        SDL_WINDOW_SHOWN | SDL_WINDOW_BORDERLESS);
    
    if (!window) {
        std::cerr << "Window creation failed: " << SDL_GetError() << std::endl;
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    SDL_Renderer* renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_SOFTWARE);
    if (!renderer) {
        std::cerr << "Renderer creation failed: " << SDL_GetError() << std::endl;
        SDL_DestroyWindow(window);
        IMG_Quit();
        SDL_Quit();
        return 1;
    }

    // Load image
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

    std::cout << "Kiosk mode started..." << std::endl;

    // Fade in over 2 seconds, display for 5 total
    Uint32 startTime = SDL_GetTicks();
    const Uint32 fadeDuration = 2000;
    const Uint32 displayTime = 5000;

    int frameCount = 0;
    while (SDL_GetTicks() - startTime < displayTime) {
        std::cout << "Frame " << frameCount << std::endl;
        
        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_QUIT || event.type == SDL_KEYDOWN) {
                goto cleanup;
            }
        }
        std::cout << "Events processed" << std::endl;

        Uint32 elapsed = SDL_GetTicks() - startTime;
        Uint8 alpha = (elapsed >= fadeDuration) ? 255 : (255 * elapsed) / fadeDuration;
        std::cout << "Alpha: " << (int)alpha << std::endl;

        SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
        SDL_RenderClear(renderer);
        std::cout << "Cleared" << std::endl;
        
        SDL_SetTextureAlphaMod(imageTexture, alpha);
        std::cout << "Alpha set" << std::endl;
        
        SDL_RenderCopy(renderer, imageTexture, nullptr, nullptr);
        std::cout << "Copied" << std::endl;
        
        SDL_RenderPresent(renderer);
        std::cout << "Presented" << std::endl;
        
        SDL_Delay(16);
        frameCount++;
        
        if (frameCount >= 2) break; // Exit after 2 frames for debug
    }

cleanup:
    SDL_DestroyTexture(imageTexture);
    SDL_DestroyRenderer(renderer);
    // Skip SDL_DestroyWindow - causes segfault on Wayland
    IMG_Quit();
    SDL_Quit();

    return 0;
}