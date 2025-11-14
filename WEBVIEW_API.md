# WebView API Documentation

This Next.js app is designed to be embedded in a Flutter app using WebView. All UI controls have been removed - the Flutter app controls object selection and the Next.js app handles the isometric room visualization and interaction.

## Available Functions

The Next.js app exposes these functions on the `window` object that Flutter can call:

### 1. `window.setSelectedItem(itemId: string)`
Selects an item type for placement in the room.

**Parameters:**
- `itemId` (string): The ID of the item to select. Available IDs:
  - `'couch'`
  - `'table'`
  - `'chair'`
  - `'bed'`
  - `'bookshelf'`
  - `'rug'`
  - `'plant'`
  - `'lamp'`
  - `'desk'`
  - `'sofa'`

**Example (Flutter):**
```dart
webViewController.runJavaScript("window.setSelectedItem('couch')");
```

### 2. `window.clearSelection()`
Clears the currently selected item.

**Example (Flutter):**
```dart
webViewController.runJavaScript("window.clearSelection()");
```

### 3. `window.getRoomState()`
Returns an array of all placed items in the room.

**Returns:** Array of PlacedItem objects with structure:
```typescript
{
  id: string,          // Unique ID
  itemId: string,      // Type of item (e.g., 'couch', 'table')
  x: number,           // Grid X position (1-9)
  y: number,           // Grid Y position (1-9)
  rotation: number,    // Rotation angle
  placementType: string // 'floor' | 'wall-back' | 'wall-left'
}
```

**Example (Flutter):**
```dart
String result = await webViewController.runJavaScriptReturningResult(
  "JSON.stringify(window.getRoomState())"
);
List<dynamic> placedItems = jsonDecode(result);
```

### 4. `window.clearRoom()`
Removes all items from the room.

**Example (Flutter):**
```dart
webViewController.runJavaScript("window.clearRoom()");
```

### 5. `window.getAvailableItems()`
Returns the list of all available furniture/decor items.

**Returns:** Array of FurnitureItem objects with structure:
```typescript
{
  id: string,
  name: string,
  category: 'furniture' | 'decor',
  imageUrl: string,
  width: number,
  height: number,
  visualHeight: number,
  placementType: 'floor' | 'wall-back' | 'wall-left',
  color: string
}
```

**Example (Flutter):**
```dart
String result = await webViewController.runJavaScriptReturningResult(
  "JSON.stringify(window.getAvailableItems())"
);
List<dynamic> items = jsonDecode(result);
```

## Events Sent to Flutter

The Next.js app sends messages to Flutter via `window.postMessage()` for these events:

### 1. `READY`
Sent when the app is fully loaded and ready to receive commands.

```json
{
  "type": "READY"
}
```

### 2. `ITEM_PLACED`
Sent when a user places an item in the room.

```json
{
  "type": "ITEM_PLACED",
  "item": {
    "id": "couch-1234567890",
    "itemId": "couch",
    "x": 5,
    "y": 5,
    "rotation": 0,
    "placementType": "floor"
  }
}
```

### 3. `ITEM_MOVED`
Sent when a user drags an item to a new position.

```json
{
  "type": "ITEM_MOVED",
  "id": "couch-1234567890",
  "x": 6,
  "y": 5
}
```

### 4. `ITEM_REMOVED`
Sent when a user double-clicks an item to remove it.

```json
{
  "type": "ITEM_REMOVED",
  "id": "couch-1234567890"
}
```

## Flutter WebView Setup Example

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'dart:convert';

class IsometricRoomWebView extends StatefulWidget {
  @override
  _IsometricRoomWebViewState createState() => _IsometricRoomWebViewState();
}

class _IsometricRoomWebViewState extends State<IsometricRoomWebView> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'FlutterChannel',
        onMessageReceived: (JavaScriptMessage message) {
          // Handle messages from Next.js app
          final data = jsonDecode(message.message);
          _handleWebViewMessage(data);
        },
      )
      ..loadRequest(Uri.parse('http://localhost:3000'));
  }

  void _handleWebViewMessage(Map<String, dynamic> data) {
    switch (data['type']) {
      case 'READY':
        print('WebView is ready');
        break;
      case 'ITEM_PLACED':
        print('Item placed: ${data['item']}');
        break;
      case 'ITEM_MOVED':
        print('Item moved: ${data['id']} to (${data['x']}, ${data['y']})');
        break;
      case 'ITEM_REMOVED':
        print('Item removed: ${data['id']}');
        break;
    }
  }

  void selectItem(String itemId) {
    _controller.runJavaScript("window.setSelectedItem('$itemId')");
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Your Flutter UI for item selection
        Wrap(
          children: [
            ElevatedButton(
              onPressed: () => selectItem('couch'),
              child: Text('Couch'),
            ),
            ElevatedButton(
              onPressed: () => selectItem('table'),
              child: Text('Table'),
            ),
            // ... more buttons
          ],
        ),
        // The WebView showing the isometric room
        Expanded(
          child: WebViewWidget(controller: _controller),
        ),
      ],
    );
  }
}
```

## User Interactions in the WebView

Users can interact with the isometric room directly:

1. **Place Item**: Click on an empty tile when an item is selected
2. **Move Item**: Click and drag an existing item to a new position
3. **Remove Item**: Double-click an item to remove it

All interactions are automatically reported back to Flutter via the message events.

## Grid System

The room uses an 11x11 grid:
- Valid placement positions: x and y from 1 to 9
- Positions 0 and 10 are walls and blocked
- Position (0,0) is the back-left corner

## Image Flipping

Objects are automatically flipped horizontally when NOT placed at the left edge (x=1) to maintain proper orientation in the isometric view.
