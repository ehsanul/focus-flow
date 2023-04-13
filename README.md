# focus-flow

A ChatGTP authored app to help you focus on the right things

## Initial Prompt (Note: much followup was required)

Create an app that helps the user make sure that they are spending their time
as they intend during their work hours, i.e. that they are working on the right
things. This should be a single page web application written with vanilla JS,
HTML and CSS, and it should use localstorage to store all state. Do NOT use
a backend of any kind, this is a pure client-side application.

When the app is initially loaded, the user is greeted with a screen asking them
what they intend to work on, i.e. their tasks. The user enters their tasks,
with two fields:

1. Task Name
2. Estimated time in hours

The user may add as many of these tasks as they like, and can see the entire
list as they add to it, including the total time for all the tasks. The user
may also edit any of the task names or time estimates, or even entirely remove
tasks.

Once the user is happy with this, they should be able to submit the list and
initialize the task list for the day. Upon submitting, the app should store
this list in localstorage for later use, and then start a timer, which is
displayed on the screen counting down.

The timer is for 15 minutes. Every 15 minutes throughout the day, when the
timer reaches zero, the app should loop an audible beep. At the same time, the
app displays the list of task names as large clickable buttons, with a question
asking the user: "What are you doing?". In addition to the task options that
were previously entered, there should also be an "Other" button, which allows
a free-text input upon clicking to record whatever the user was actually doing,
and a submit button for that too. This should be stored in localstorage along
with a timestamp.

When the task buttons or "Other" button are clicked, the beeping should stop
immediately and the 15 minute timer should restart. The selection should be
tracked and shown in a visualization showing how many times each option was
selected in total, each counting for 15 minutes of time. This visualization
should have a scale of time in hours. The "Other" option should also be broken
down into the specific unique items entered by the user for this visualization.

Also support an option to pause the timer, either for 1 hour or until
a specific time on the next work day, at which point it will beep again to
remind the user to use the app in the next work day. Also ask the user to edit
their items and reset their selection stats at the start of each day.

Please provide separate HTML, JS and CSS files for this application. It should
have a modern style, with a grid layout and plenty of whitespace and great
typography. Please also make it a dark-mode theme by default, with an option to
switch to light mode.

Come up with your own catchy name for the app and add this app name as a small
text logo on the page.
