# PopOff - Short Form Video Social Media App

![tiktok](https://github.com/user-attachments/assets/676d0eae-d6ab-462a-b767-6cc623dbd6fa)

## Project Overview
PopOff is a short form video social media mobile app designed to replicate the core features of TikTok. The app allows users to create accounts, upload and share videos, interact with other users through likes, comments, and follows, and discover content through an intelligent recommendation algorithm. Built with a full stack approach, PopOff leverages React Native Expo for the mobile frontend, Django REST Framework for the backend API, PostgreSQL for data storage, and AWS for cloud infrastructure. The project was created as a challenge to build and deploy a TikTok clone within 24 hours, with the goal of launching on both the App Store and Play Store.

## Features
- User account creation and authentication
- Home page with scrollable feed of vertical videos posted by other users
- Likes and comments on each post
- Uploading and posting videos with tags and captions
- Profile page displaying all of a user's posts
- Ability to follow users and view a dedicated following page
- Intelligent recommendation algorithm that learns user interests
- Search page to find accounts
- Ability to block users and report posts

## Videos

### Demo Video

https://github.com/user-attachments/assets/d6255bad-26f2-402e-b5ad-174d4d484bc2

### YouTube Video

[![Can I Build a TikTok Clone in 24 Hours?](https://img.youtube.com/vi/j6t_7tzyfRk/0.jpg)](https://www.youtube.com/watch?v=j6t_7tzyfRk)

## Setup and Installation

### Prerequisites
- Node.js and npm installed. You can download them from https://nodejs.org/.
- Expo CLI installed globally (`npm install -g expo-cli`)
- Backend server running (see linked backend repository)

### Installation Steps
1. Clone the repository:
   ```
   git clone [repository-url]
   cd PopOff
   ```
2. Install frontend dependencies and Expo CLI:
   ```
   npm install
   npm install -g expo-cli
   ```
3. For iOS setup (macOS only):
   ```
   cd ios
   pod install
   npx expo run:ios
   ```
4. Set up backend environment:
    - see linked backend repository for setup instructions.

## Running the App

### Running with Expo Dev Client

- To build android native folder
  ```
  cd android; .\\gradlew.bat assembleDebug
  ```
- To prebuild native projects:
  ```
  npx expo prebuild
  ```
- To start the development server with the dev client:
  ```
  npx expo start --dev-client
  ```
- To run on a connected iOS device:
  ```
  npx expo run:ios --device
  ```

## Building for Production

### Android
- Generate a signed APK or AAB using Expo:
  ```
  eas build -p android --profile production
  ```
- Follow prompts to configure signing keys if not already set up.

### iOS
- Build the app for iOS using Expo:
  ```
  eas build -p ios --profile production
  ```
- Requires an Apple Developer account and proper certificates.

## Version Information
- React Native: 0.76.9
- Expo SDK: 52
- React: 18.3.1

## Troubleshooting and Patches

- If you encounter issues with native dependencies or build errors, check the `patches/` directory for patches applied to dependencies, such as `react-native+0.76.9.patch`.
- iOS Patch:
  - Modify `ios/App/Pods/Target Support Files/Pods-App/Pods-App.debug.xcconfig` to include:
    ```
    ENABLE_USER_SCRIPT_SANDBOXING = NO
    ```
- Common issues:
  - Android build failures: Ensure `android/gradle.properties` and signing configs are correct.
  - Expo CLI issues: Update Expo CLI to the latest version.
  - Backend connection errors: Verify backend server is running and accessible.
- For patch application issues, re-apply patches using:
  ```
  npx patch-package
  ```
- Consult the project issues page for known bugs and fixes.

## Native Android Build Configuration

Since this project is an ejected Expo app using Expo Dev Client with custom native code, the entire `android` folder is included in version control. This folder contains all native Android project files necessary for building and running the app.

Key points about the `android` folder and `gradle.properties`:

- The `android/gradle.properties` file configures important build settings such as JVM memory allocation, AndroidX usage, supported CPU architectures, Hermes JS engine enablement, and packaging options.
- Signing keys for release builds should NOT be stored in `gradle.properties` directly to avoid committing sensitive information.
- Instead, use `android/gradle.properties.local` (which should be gitignored) to store sensitive signing key properties such as `MYAPP_UPLOAD_STORE_FILE` and `MYAPP_UPLOAD_KEY_ALIAS`.
- This approach keeps sensitive keys out of version control while allowing local builds to access necessary signing information.
- It is critical to keep the rest of the `android` folder and its configuration files under version control to ensure consistent builds across environments.
- If you encounter build issues related to native code, verify the contents of `gradle.properties` and `gradle.properties.local` as well as other native configuration files.
- For applying patches to native dependencies, use the `patch-package` tool and keep patch files in the `patches/` directory.

Following these practices will help maintain a stable and secure native build environment for the app.

## Android FFmpeg Kit Integration

This project integrates FFmpeg Kit version 6.0-2 full-gpl package for advanced multimedia processing on Android.

## Licensing (GPL-2)

This project is licensed under **GPL-2 (or later)** due to the inclusion of the **FFmpeg Kit `full-gpl` package**. The use of GPL components in FFmpeg requires the entire project to comply with GPL-2 licensing terms when distributed, including:

- **Providing access to the complete corresponding source code** upon distribution.
- **Allowing modifications and redistribution** under the same GPL-2 (or later) terms.
- Ensuring **all linked and derived works are also GPL-compatible** when distributing binaries.

If you plan to distribute this project (including on the Play Store), review your full dependency chain to ensure GPL compliance and consult legal counsel if needed.

For details on FFmpeg’s GPL requirements, see:
- [FFmpeg Licensing](https://ffmpeg.org/legal.html)
- [FFmpeg Kit Licensing](https://github.com/arthenica/ffmpeg-kit/blob/main/LICENSE.GPLv3)

### Key Customizations and Settings

- The FFmpeg Kit AAR file (`ffmpeg-kit-full-gpl-6.0-2.aar`) is included locally in the `android/app/libs` directory and referenced explicitly in the build configuration.
- The `ffmpeg-kit-react-native` module is included as a local project under `android/ffmpeg-kit-react-native` with Java 11 compatibility and custom namespace.
- ABI filters in `android/app/build.gradle` exclude x86 and x86_64 architectures, building only for `armeabi-v7a` and `arm64-v8a`.
- Packaging options pick the first occurrence of `libc++_shared.so` to avoid native library conflicts.
- The FFmpeg Kit version and package type are defined in `android/build.gradle` as:
  ```gradle
  ext {
      ffmpegKitPackage = 'full-gpl'
      ffmpegKitVersion = '6.0-2'
  }
  ```

### Building the FFmpeg Kit AAR

For more details and official documentation, visit the FFmpeg Kit GitHub repository: [https://github.com/arthenica/ffmpeg-kit](https://github.com/arthenica/ffmpeg-kit)

It is recommended to use WSL (Windows Subsystem for Linux) on Windows for building the FFmpeg Kit AAR. To build the FFmpeg Kit AAR locally, use the following environment variables and build commands:

```bash
export ANDROID_SDK_ROOT=$HOME/Android/sdk
export ANDROID_NDK_ROOT=$ANDROID_SDK_ROOT/ndk/25.1.8937393
export PATH=$ANDROID_NDK_ROOT/toolchains/llvm/prebuilt/linux-x86_64/bin:$PATH
export CC=aarch64-linux-android21-clang
export CXX=aarch64-linux-android21-clang++

./android.sh --full --lts --disable-arm-v7a --disable-arm-v7a-neon --disable-x86 --disable-x86-64 --disable-lib-libiconv --disable-lib-libaom --disable-lib-tiff --disable-lib-opencore-amr --disable-lib-dav1d --disable-lib-kvazaar --disable-lib-ilbc --disable-lib-tesseract --disable-lib-twolame --disable-lib-sdl --disable-lib-zimg --disable-lib-vo-amrwbenc --disable-lib-snappy --disable-lib-sndfile --disable-lib-giflib --disable-lib-chromaprint --disable-lib-libass --disable-lib-leptonica --disable-lib-fontconfig --disable-lib-freetype --disable-lib-harfbuzz --disable-lib-fribidi --disable-lib-lame --disable-lib-libvpx

# to view the build log in another terminal
tail -f build.log
```

This builds the full GPL version of FFmpeg Kit with specific architectures and libraries disabled as per project requirements.
