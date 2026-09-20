package com.herepath;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

/**
 * Sends an image straight to a social app (Instagram or TikTok), skipping the phone's share sheet.
 * The image must already be a file in the app's cache (the web side writes it there), which is
 * shared through the FileProvider declared in the manifest.
 */
@CapacitorPlugin(name = "SocialShare")
public class SocialSharePlugin extends Plugin {

  private static final String INSTAGRAM = "com.instagram.android";
  // TikTok ships under two package names depending on the region the phone was sold in.
  private static final String[] TIKTOK = { "com.zhiliaoapp.musically", "com.ss.android.ugc.trill" };

  private boolean installed(String packageName) {
    try {
      getContext().getPackageManager().getPackageInfo(packageName, 0);
      return true;
    } catch (PackageManager.NameNotFoundException e) {
      return false;
    }
  }

  /** The installed package for an app name from the web side, or null if it isn't installed (or isn't one we know). */
  private String installedPackage(String app) {
    if ("instagram".equals(app)) return installed(INSTAGRAM) ? INSTAGRAM : null;
    if ("tiktok".equals(app)) {
      for (String name : TIKTOK) {
        if (installed(name)) return name;
      }
    }
    return null;
  }

  @PluginMethod
  public void share(PluginCall call) {
    String path = call.getString("path");
    if (path == null || path.isEmpty()) {
      call.reject("No image was given.", "NO_IMAGE");
      return;
    }
    String packageName = installedPackage(call.getString("app", ""));
    if (packageName == null) {
      call.reject("That app isn't installed on this phone.", "NOT_INSTALLED");
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
      intent.setPackage(packageName);
      intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
      getActivity().startActivity(intent);
      call.resolve();
    } catch (ActivityNotFoundException e) {
      call.reject("The app couldn't open the image.", "NOT_INSTALLED");
    } catch (IllegalArgumentException e) {
      call.reject("The image file couldn't be shared.", "NO_IMAGE");
    }
  }
}
