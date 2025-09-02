# Time Tracker

A modern, interactive time tracking application built with Next.js and React. This application allows users to create and manage time blocks throughout their day with an intuitive drag-and-drop interface.

## Features

- Daily time tracking with calendar navigation
- Drag-and-drop task creation and resizing
- Color-coded tasks for better organization
- Detailed task management with titles and descriptions
- Automatic local storage persistence
- Responsive design
- 15-minute interval time slots from 7 AM to 12 AM

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone [your-repository-url]
cd time-tracker
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### Creating Tasks

- **Single Time Slot**: Click on an empty time slot to create a task for that specific time.
- **Multiple Time Slots**: Click and drag across multiple time slots to create a longer task.

### Managing Tasks

- **Edit Task**: Click on any task to open the sidebar editor where you can:
  - Add/modify the task title
  - Add/modify the task description
  - View the task duration
  - Delete the task

### Resizing Tasks

- **Adjust Start Time**: Click and drag the top half of a task to modify its start time
- **Adjust End Time**: Click and drag the bottom half of a task to modify its end time

### Navigation

- Use the calendar icon to select a specific date
- Use the arrow buttons to navigate between days
- The current date is always displayed at the top of the application

## Technical Details

The application is built using:

- Next.js 13+ with App Router
- React for the UI
- Tailwind CSS for styling
- date-fns for date manipulation
- Local Storage for data persistence

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
