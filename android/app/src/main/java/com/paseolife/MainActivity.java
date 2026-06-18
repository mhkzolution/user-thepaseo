package com.paseolife;

import android.graphics.Color;
import android.os.Bundle;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // ต้องเรียกก่อน super เพื่อให้มีผลก่อน Capacitor ตั้งค่า WebView
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        super.onCreate(savedInstanceState);

        // API < 35: ตั้งสีตรง / API 35+: ถูก ignore แต่ไม่เป็นไร
        getWindow().setStatusBarColor(Color.BLACK);

        // ไอคอน Status Bar สีขาว
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(false);

        // API 35+: Status Bar โปร่งใสเสมอ → ตั้ง background ของ root view เป็นสีดำ
        // เพื่อให้พื้นที่ด้านหลัง Status Bar แสดงสีดำออกมา
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);

        // เพิ่ม padding-top ให้ content view ตาม status bar height
        ViewCompat.setOnApplyWindowInsetsListener(
                getWindow().getDecorView().findViewById(android.R.id.content),
                (view, insets) -> {
                    int top = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
                    view.setPadding(0, top, 0, 0);
                    return insets;
                });
    }
}
