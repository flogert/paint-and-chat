# Paint and Chat 🎨

A cozy, real-time collaborative drawing and chatting application built with Next.js and Socket.io.

## Features

- **Real-time Collaboration**: Draw with friends in real-time.
- **Live Chat**: Integrated chat sidebar to communicate while you create.
- **Drawing Tools**:
  - Brush (with adjustable size, opacity, and styles like dotted/fuzzy)
  - Eraser
  - Bucket Fill
  - Shapes (Rectangle, Circle, Line)
- **Daily Challenge**: A built-in game mode with random prompts and a timer to spark creativity.
- **Cozy UI**: A warm, accessible, and mobile-friendly interface.
- **Mobile Support**: Fully responsive design with touch support for drawing on tablets and phones.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router & Pages Router for API)
- **Real-time Engine**: [Socket.io](https://socket.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Graphics**: HTML5 Canvas API

## Getting Started

1.  **Clone the repository**

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Open the app**
    Visit [http://localhost:3000](http://localhost:3000) in your browser. Open multiple tabs or use different devices on the same network to test the real-time features!

## Project Structure

- `src/app/`: Main application code (App Router).
- `src/pages/api/socket.js`: Socket.io server handler.
- `src/components/`: Reusable UI components (Canvas, Toolbar, ChatSidebar, GameSidebar).
- `src/lib/`: Utility functions and socket client initialization.

## Contributing

Feel free to open issues or submit pull requests if you have ideas for new tools or features!

## License

MIT
