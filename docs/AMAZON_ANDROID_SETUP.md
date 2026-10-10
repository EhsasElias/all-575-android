# Android + Amazon Appstore setup

## 1. Prepare your local machine

Install Node.js, Android Studio, and an Android SDK.

## 2. Create Android project

From the project folder:

npm install
npm run build
npm run android:add
npm run android:sync
npm run android:open

The Android project opens in Android Studio.

## 3. Test locally

Use a physical device or emulator. The app needs INTERNET permission once the production API is enabled.

## 4. Build a release APK/AAB

In Android Studio configure a release signing key, increment versionCode/versionName for new releases, and generate a signed APK or AAB.

## 5. Amazon Appstore

Create an Amazon Developer account, create a new app listing, upload the signed Android binary, configure supported devices and listing metadata, then use Live App Testing for a private test group before production submission.

## iPhone

Amazon Appstore does not publish iOS apps. Use Xcode + App Store Connect/TestFlight for iPhone.
