### add new features 
1. User Snips an Image:

The user captures a screenshot via the snipping tool.

The snipped image is temporarily held in the app's memory.

2. Show Dropdown Menu:

The snipping tool interface will display a button that opens a dropdown list when clicked.

The options in the dropdown menu are:

"React"

"Vue"

"Flutter"

3. User Selects Option:

After selecting an option, the workflow proceeds as follows depending on whether "React," "Vue," or "Flutter" is chosen.

If "React" is Selected:

Step 1: Send Snipped Image & Prompt to LLM

When the user picks React, the snipped image and a detailed "image analysis prompt" are sent to the Large Language Model (LLM).

Prompt Example (for React):
"Hey LLM, I’ve just uploaded a snipped image. Analyze the contents of the image and generate a detailed description of the UI elements. Be sure to capture any interactive elements, layouts, buttons, and form fields. Your goal is to extract this information and help me build a React component from it."

Step 2: LLM Analyzes the Image

The LLM returns a detailed textual description of the image content. This could include UI components like buttons, forms, headers, and navigation, or any other interactive elements.

Step 3: Send Description Back to LLM to Generate React Code

The snipping app sends the LLM’s textual analysis (and the original snipped image) to the LLM with the following request for React component code:

Request Prompt Example (for React Code):
"Based on the description above and the visual elements in the image, create a React component in JSON format. The component should be modular, use functional components where applicable, and include props, state, and necessary event handlers. The UI should match the layout from the image, including button styles, form fields, and any interactions."

Step 4: LLM Generates React Component Code

The LLM returns the React component code in JSON format. The JSON will contain the necessary code structure, props, and other details for building the React component.

Step 5: Generate Text File with React Code

The snipping app receives the React component JSON and processes it into a text file containing the generated React component code, which the user can directly use.

If "Flutter" is Selected:

Step 1: Send Snipped Image & Prompt to LLM

The process starts the same way, with the snipped image and a Flutter-specific prompt being sent to the LLM.

Prompt Example (for Flutter):
"Hey LLM, analyze the image I’ve uploaded and identify the Flutter widget layout. Describe UI elements such as buttons, text fields, and any other widgets present in the design. This will help us build a Flutter widget from this image."

Step 2: LLM Analyzes the Image

The LLM returns a description similar to the React workflow but tailored for Flutter.

Step 3: Send Description Back to LLM to Generate Flutter Code

The snipping app sends the Flutter prompt and the image back to the LLM with a request for Flutter widget code in JSON format.

Request Prompt Example (for Flutter Code):
"Generate a Flutter widget in JSON format based on the provided analysis. The widget should match the layout and functionality described above, with emphasis on properties, event handling, and the widget tree structure."

Step 4: LLM Generates Flutter Widget Code

The LLM returns Flutter widget code in JSON format.

Step 5: Generate Text File with Flutter Widget Code

The snipping app processes the Flutter widget JSON and creates a text file with the Flutter widget code, ready for use.

If "Vue" is Selected:

Step 1: Send Snipped Image & Prompt to LLM

The snipping app sends the image and a Vue-specific prompt to the LLM.

Prompt Example (for Vue):
"Analyze the image I’ve snipped and identify any Vue component UI elements. Describe any buttons, forms, input fields, or other interactive components visible in the design. Help us create a Vue component from this."

Step 2: LLM Analyzes the Image

The LLM returns a description of the image, focusing on Vue components and layout.

Step 3: Send Description Back to LLM to Generate Vue Code

The app sends the description and snipped image to the LLM for the generation of Vue component code.

Request Prompt Example (for Vue Code):
"Generate a Vue component in JSON format based on the visual and textual description. Ensure the component includes props, methods, data binding, and other Vue-specific syntax. The component should match the structure of the UI in the image."

Step 4: LLM Generates Vue Component Code

The LLM returns the Vue component code in JSON format.

Step 5: Generate Text File with Vue Code

The snipping app processes the Vue JSON code and generates a text file containing the Vue component code.

Summary of Key Tasks for Each Framework:

React: The app sends a snipped image and request for a React component code, the LLM analyzes the UI, generates React component code in JSON, and the app saves it as a text file.

Flutter: The app sends a snipped image and request for a Flutter widget code, the LLM analyzes the image and returns Flutter widget code in JSON, and the app saves it as a text file.

Vue: The app sends a snipped image and request for a Vue component code, the LLM analyzes the image and returns Vue component code in JSON, and the app saves it as a text file.