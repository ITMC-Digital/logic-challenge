// Real-World Logical Thinking & System Design Challenge
// Content transcribed verbatim from the source assessment document.

const ASSESSMENT = {
  title: "Real-World Logical Thinking",
  subtitle: "& System Design Challenge",
  tagline: "Employee Assessment · 60 minutes · 100 marks",
  objective:
    "This activity evaluates how participants understand an unfamiliar problem, identify constraints, compare possible solutions, anticipate failures, and explain their reasoning. The goal is not to guess a company’s exact internal implementation or to write production code.",
  instructions: [
    "Read each scenario carefully before answering.",
    "State any assumptions you make. Ask clarifying questions if information is missing.",
    "Explain why your approach would work; mention alternatives and trade-offs where relevant.",
    "Consider edge cases, failures, security, fairness, and performance where applicable.",
    "Use short notes, a flowchart, a diagram, or pseudocode if helpful.",
    "You may not know every technical term. Clear reasoning matters more than jargon.",
  ],
  totalMinutes: 60,
  minutesPerProblem: 12,
};

const PROBLEMS = [
  {
    id: 1,
    title: "Concert Ride-Booking System",
    focus: ["System design", "Location tracking", "Concurrency", "Scalability"],
    statement:
      "A large concert ends at 11:00 PM. Around 10,000 people open a ride-booking app within five minutes, but only 1,000 drivers are available nearby. Roads are congested, drivers keep moving, and GPS locations are updated every few seconds. The app must match riders and drivers while remaining responsive.",
    questions: [
      "How would you design the process for matching a passenger with an available driver?",
      "If the city has 100,000 active drivers, how could the app find suitable nearby drivers without checking every driver one by one?",
      "Two passengers request the same driver at almost the same time. How would you prevent the driver from being assigned to both?",
      "A driver accepts a ride but cancels 30 seconds later. What should happen next?",
      "Would you select the geographically nearest driver or the driver with the shortest estimated arrival time? Explain your choice.",
      "How would you handle 10,000 requests arriving in a short period without overwhelming the service?",
      "GPS updates are delayed by 20 seconds. How could the app avoid relying on misleading location data?",
      "There are only 1,000 drivers for 10,000 riders. How would you communicate availability and manage the remaining requests?",
    ],
    bonus:
      "Describe the high-level flow from tapping “Book” to ride completion. Name at least three system components and explain their roles.",
  },
  {
    id: 2,
    title: "Railway Seat Allocation",
    focus: ["Logical reasoning", "Data modelling", "Transactions", "Fairness"],
    statement:
      "A train travels from Delhi to Patna and stops at Kanpur and Lucknow. Passenger A wants Delhi–Patna, Passenger B wants Delhi–Kanpur, and Passenger C wants Kanpur–Patna. The train has limited seats, and passengers may request lower, middle, or upper berths. During Tatkal, many requests may arrive together.",
    questions: [
      "Could Passengers B and C use the same physical seat for different parts of the journey? State the conditions that must be checked.",
      "How would you check whether a seat is available for a journey spanning several stops?",
      "How would you prevent another passenger from being allocated a seat for an overlapping journey segment?",
      "Only five lower berths are available, but 20 passengers request one. How should the system decide who receives them while following applicable rules?",
      "Thousands of users try to book the last seat at the same time. How would you prevent duplicate confirmed bookings?",
      "A seat is temporarily held, but payment fails or times out. How should the system release or retain it?",
      "How would cancellations and a waiting list affect seat availability?",
      "How would you keep the booking process fast without sacrificing correct allocation?",
    ],
    bonus:
      "Sketch a simple data model or table structure that records each seat and the journey segment for which it is reserved. This is a design exercise; do not assume you know IRCTC’s internal implementation.",
  },
  {
    id: 3,
    title: "Searching 100,000 Employee Records",
    focus: ["Algorithms", "Database design", "Indexing", "Performance"],
    statement:
      "An HRMS contains 100,000 employee records. Each record has an employee ID, name, email, department, joining date, and employment status. HR users need to search and filter records quickly. Some names are duplicated, and users may search by a full name or a partial name such as “Ami”.",
    questions: [
      "How would you find an employee by an exact employee ID?",
      "If the records are unsorted, what is a straightforward search method? What is its main limitation?",
      "If records are sorted by employee ID, how could you search more efficiently?",
      "How would you support partial-name search such as “Ami” matching “Amit”?",
      "How would you distinguish between multiple employees with the same name?",
      "Would you load all records into application memory or query a database? Explain the trade-offs.",
      "What is a database index, and which fields might benefit from one for these search patterns?",
      "If the system grows to 10 million records, what would you measure or investigate before redesigning it?",
    ],
    bonus:
      "HR frequently filters by department and employment status, then sorts by joining date. Suggest how you would make this query efficient and explain what you would test.",
  },
  {
    id: 4,
    title: "Pickup Location and Fare Optimization",
    focus: ["Optimization", "Routing", "User experience", "Safety"],
    statement:
      "A passenger stands on one side of a divided road, while a driver is on the other. The app suggests an alternative pickup point that may reduce the fare by ₹30. The passenger would walk 400 metres to reach it, and the driver may otherwise need to make a U-turn. Traffic, road access, and safety also matter.",
    questions: [
      "How would you compare the estimated fare and travel time for the original and alternative pickup points?",
      "Why might the geographically closest pickup point not be the fastest or cheapest?",
      "What information would you need about road networks, dividers, legal U-turns, traffic, and walking routes?",
      "Should the app automatically change the pickup point or ask the passenger to choose? Explain.",
      "How would you avoid recommending an unsafe walking route or a point that cannot be reached legally?",
      "What should happen if the driver moves while the passenger is walking to the suggested point?",
      "How would you measure whether this feature improves the experience rather than just reducing the fare?",
      "Which factors should outweigh the ₹30 saving if the alternatives involve extra walking or delay?",
    ],
    bonus:
      "The alternative saves ₹30, adds five minutes of walking for the passenger, and adds three minutes to the driver’s journey. Propose a decision rule for when to recommend it.",
  },
  {
    id: 5,
    title: "Ticket Booking Under Heavy Traffic",
    focus: ["Concurrency", "Queueing", "Payments", "Failure recovery"],
    statement:
      "An online concert platform has 100 tickets remaining. At 10:00 AM, 5,000 users attempt to purchase tickets at once. The payment gateway sometimes responds slowly, and some users click the Book button repeatedly or retry after a timeout. The platform must not sell more tickets than it has.",
    questions: [
      "How would you guarantee that no more than 100 tickets are confirmed as sold?",
      "Would you temporarily reserve a ticket while the user pays? If so, how long should the hold last?",
      "What should happen when a temporary reservation expires while a payment request is still processing?",
      "Payment succeeds, but the confirmation message fails. How can the user’s booking be recovered correctly?",
      "How would you prevent repeated clicks or retries from creating duplicate bookings or charges?",
      "Would you use a queue, direct requests, or a combination? Explain the trade-offs.",
      "If the database becomes slow, how would you protect the booking service and communicate status to users?",
      "How would you safely return tickets to inventory when users abandon checkout or payments fail?",
    ],
    bonus:
      "A payment succeeds, but the booking service crashes before recording the confirmation. Explain how you would reconcile the payment and booking without charging the user twice.",
  },
];

// Evaluator rubric: 5 criteria × 4 marks each = 20 marks per problem, 100 total.
const RUBRIC_CRITERIA = [
  { key: "understanding", label: "Understands the problem and constraints", max: 4 },
  { key: "breakdown", label: "Breaks the problem into logical steps", max: 4 },
  { key: "solution", label: "Proposes a practical solution and explains why", max: 4 },
  { key: "edgeCases", label: "Identifies edge cases and failure scenarios", max: 4 },
  { key: "communication", label: "Communicates clearly and justifies trade-offs", max: 4 },
];
