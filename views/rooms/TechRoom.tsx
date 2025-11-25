<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cây Tâm Tư - The Living Soul Tree (V2)</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&family=Playfair+Display:ital,wght@1,500&display=swap');

        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #050505;
            font-family: 'Montserrat', sans-serif;
            color: #fff;
        }

        #canvas-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }

        /* --- UI LAYER --- */
        #ui-layer {
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10;
            width: 90%;
            max-width: 550px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            pointer-events: none; /* Để click xuyên qua vùng trống */
        }

        .controls {
            background: rgba(15, 15, 20, 0.85);
            backdrop-filter: blur(16px);
            padding: 20px 30px;
            border-radius: 50px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 40px rgba(0,0,0,0.9), inset 0 0 20px rgba(255,255,255,0.05);
            display: flex;
            align-items: center;
            gap: 20px;
            pointer-events: auto;
            transition: transform 0.3s ease;
        }
        .controls:hover { transform: scale(1.02); }

        .energy-group { display: flex; gap: 12px; align-items: center; }
        .divider { width: 1px; height: 30px; background: rgba(255,255,255,0.2); }

        .mood-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .mood-btn:hover { transform: scale(1.15); }
        .mood-btn.active {
            transform: scale(1.25);
            border-color: #fff;
            box-shadow: 0 0 20px currentColor;
        }

        .mood-btn::before {
            content: attr(data-label);
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 12px;
            background: rgba(0,0,0,0.9);
            color: #fff;
            padding: 5px 10px;
            border-radius: 6px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s, top 0.2s;
            white-space: nowrap;
            font-family: 'Playfair Display', serif;
        }
        .mood-btn:hover::before { opacity: 1; top: -45px; }

        textarea {
            width: 100%;
            max-width: 400px;
            background: rgba(0,0,0,0.3);
            border: none;
            border-bottom: 1px solid rgba(255,255,255,0.3);
            color: #eee;
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            text-align: center;
            padding: 15px;
            outline: none;
            border-radius: 10px 10px 0 0;
            pointer-events: auto;
            transition: all 0.3s;
        }
        textarea:focus { border-bottom-color: #4facfe; background: rgba(0,0,0,0.6); }

        .feed-btn {
            margin-top: 5px;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,
