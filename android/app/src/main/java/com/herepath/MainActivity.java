package com.herepath;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // App-specific plugins have to be registered before the bridge starts.
    registerPlugin(InstagramSharePlugin.class);
    super.onCreate(savedInstanceState);
  }
}
