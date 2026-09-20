package com.herepath;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * Sends an image straight to the Instagram app, skipping the phone's share sheet. The image must
 * already be a file in the app's cache (the web side writes it there), which is shared through the
 * FileProvider declared in the manifest.
 */
@CapacitorPlugin(name = "InstagramShare")
public class InstagramSharePlugin extends Plugin {

  private static final String INSTAGRAM = "com.instagram.android";

  private boolean instagramInstalled() {
    try {
      getContext().getPackageManager().getPackageInfo(INSTAGRAM, 0);
      return true;
    } catch (PackageManager.NameNotFoundException e) {
      return false;
    }
  }

  @PluginMethod
  public void isInstalled(PluginCall call) {
    JSObject result = new JSObject();
    result.put("installed", instagramInstalled());
    call.resolve(result);
  }

  @PluginMethod
  public void share(PluginCall call) {
    String path = call.getString("path");
    if (path == null || path.isEmpty()) {
      call.reject("No image was given.", "NO_IMAGE");
      return;
    }
    if (!instagramInstalled()) {
      call.reject("Instagram isn't installed on this phone.", "NOT_INSTALLED");
      return;
    }

    String filePath = Uri.parse(path).getPath();
    File file = filePath == null ? null : new File(filePath);
    if (file == null || !file.exists()) {
      call.reject("The image file couldn't be found.", "NO_IMAGE");
      return;
    }

    try {
      Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", file);
      Intent intent = new Intent(Intent.ACTION_SEND);
      intent.setType("image/png");
      intent.putExtra(Intent.EXTRA_STREAM, uri);
      intent.setPackage(INSTAGRAM);
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      getActivity().startActivity(intent);
      call.resolve();
    } catch (ActivityNotFoundException e) {
      call.reject("Instagram couldn't open the image.", "NOT_INSTALLED");
    } catch (IllegalArgumentException e) {
      call.reject("The image file couldn't be shared.", "NO_IMAGE");
    }
  }
}
