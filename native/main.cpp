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

        // Set texture alpha and render
        SDL_SetTextureAlphaMod(imageTexture, alpha);
        SDL_RenderCopy(renderer, imageTexture, nullptr, nullptr);

        SDL_RenderPresent(renderer);
        SDL_Delay(16); // ~60 FPS
    }

    SDL_DestroyTexture(imageTexture);
    SDL_DestroyRenderer(renderer);
    SDL_DestroyWindow(window);
    IMG_Quit();
    SDL_Quit();

    return 0;
}