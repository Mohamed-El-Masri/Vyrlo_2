Api base Url: 'https://virlo.vercel.app/ '
1.	Auth
a.	Sign up : ‘'https://virlo.vercel.app/signup’
Post : {
    "username":"momen",
    "email":"momensaleh2468@gmail.com",
    "password":"m1234567"
}
Response :
- 201 : {
    "message": "User Created Successfully"
}
-	409 Conflict: {
    "statusCode": 409,
    "message": "already registerd"
}
500Internal Server Error : when dublicated user name :
{
    "statusCode": 500,
    "message": "Internal server error"
}
b.	Signin : ‘'https://virlo.vercel.app/signin’ – post 
i.	201Created: {
    "message": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibW9tZW4iLCJlbWFpbCI6Im1vbWVuc2FsZWgyNDY4QGdtYWlsLmNvbSIsInVzZXJJZCI6IjY3YTg5OWY1MTkwOWJjNjBjY2RjMjZhNyIsImlhdCI6MTc0MDEwMzIwMX0.m9M3Je5XhXCSbLFWXukPE_7PIRdTKr8Fd049ct24AkM"
}
ii.	500Internal Server Error : when email or password is wrong 
{
    "statusCode": 500,
    "message": "Internal server error"
}


c.	‘'https://virlo.vercel.app/forgetpass/reset’ : post : 
{
    "email":"momensaleh2468@gmail.com",
    "newPassword":"ma12345678",
    "otp":"827427"
}
d.	‘'https://virlo.vercel.app/send-otp’ : post
{
    "email":"momensaleh2468@gmail.com"
}
		Response 201Created: 
			{
    "message": "OTP sent to email"
}


e.	'https://virlo.vercel.app/change-pass’ : put 
{
    "oldPassword":"ma12345678",
    "newPassword":"m1234567"
}
		Response 403Forbidden : {
    "statusCode": 403,
    "message": "Incorrect old password"
}
				Or response …. 
f.	Edit profile : post ‘ 'https://virlo.vercel.app/profile/{UserId}’ for Example : 'https://virlo.vercel.app/profile/67a899f51909bc60ccdc26a7’
-	profilePic : type ‘ file ‘ 
-	title : type text 
-	phoneNumber: type text
-	address: type text
-	city: type text
-	state: type text
-	zipCode: type text
-	about: type text
-	socialAccounts: type text
response 201Created : 
{
    "numberOfProjects": 0,
    "_id": "67aa4ae73f7622b5e0af990d",
    "userId": "67a899f51909bc60ccdc26a7",
    "profilePic": [
        "http://res.cloudinary.com/da44zf1mo/image/upload/v1740104111/Category/icons/szn0adraujidvgrnkeyo.png"
    ],
    "socialAccounts": [
        {
            "platform": "LinkedIn",
            "url": "https://linkedin.com/in/username",
            "_id": "67b7e1b03e563fdd31b8dbff"
        },
        {
            "platform": "GitHub",
            "url": "https://github.com/username",
            "_id": "67b7e1b03e563fdd31b8dc00"
        }
    ],
    "createdAt": "2025-02-10T18:52:23.839Z",
    "updatedAt": "2025-02-21T02:15:12.192Z",
    "address": "123 Main Street",
    "phoneNumber": "1234567890",
    "title": "Software Engineer",
    "about": "Passionate developer with experience in full-stack development",
    "city": "new york",
    "state": "yn",
    "zipCode": "10001"
}

Or 400Bad Request: {
    "statusCode": 400,
    "message": "Invalid file type."
}
g.	get profile ( get ) : 'https://virlo.vercel.app/profile/{UserId}’ for Example : 'https://virlo.vercel.app/profile/67a899f51909bc60ccdc26a7’
response : 
[
    {
        "numberOfProjects": 0,
        "_id": "67aa4ae73f7622b5e0af990d",
        "userId": {
            "_id": "67a899f51909bc60ccdc26a7",
            "username": "momen",
            "email": "momensaleh2468@gmail.com",
            "password": "$2b$10$gPBnXDpdYGaaroO5upOMp.qM3F059Y.sYZW..jJg.Gl7N.bDLnq/q",
            "createdAt": "2025-02-09T12:05:09.656Z",
            "updatedAt": "2025-02-21T02:04:45.709Z",
            "OTBCode": "309001",
            "OTBCodeExpiry": "2025-02-21T02:19:45.709Z",
            "isBanned": false
        },
        "profilePic": [
            "http://res.cloudinary.com/da44zf1mo/image/upload/v1740104111/Category/icons/szn0adraujidvgrnkeyo.png"
        ],
        "socialAccounts": [
            {
                "platform": "LinkedIn",
                "url": "https://linkedin.com/in/username",
                "_id": "67b7e1b03e563fdd31b8dbff"
            },
            {
                "platform": "GitHub",
                "url": "https://github.com/username",
                "_id": "67b7e1b03e563fdd31b8dc00"
            }
        ],
        "createdAt": "2025-02-10T18:52:23.839Z",
        "updatedAt": "2025-02-21T02:15:12.192Z",
        "address": "123 Main Street",
        "phoneNumber": "1234567890",
        "title": "Software Engineer",
        "about": "Passionate developer with experience in full-stack development",
        "city": "new york",
        "state": "yn",
        "zipCode": "10001"
    }
]

h.	forget password request (post): ‘'https://virlo.vercel.app/forgetpass/request’
request :
{
    "email":"momensaleh2468@gmail.com"
}
			Response : {
    "message": "OTP sent to email"
}
2.	checkout (post) to user pay to can make his listings active and publish into the website  : ‘ 'https://virlo.vercel.app/profile/api/checkout’ :
{
    //token need in headers to get userId
  "transactionId": "test123",
  "type": "monthly",
  "listingId": "67ab7fdae9fc0bcda8726b39",
  "price": 20
}
3.	pricing 
a.	get all ( GET ) : https://virlo.vercel.app/pricing
response : 
[
    {
        "_id": "67a8f12d25d1f11973d902fe",
        "monthlyPrice": "20",
        "yearlyPrice": "20",
        "postingPrice": "20",
        "createdAt": "2025-02-09T18:17:17.960Z",
        "updatedAt": "2025-02-11T16:43:16.122Z"
    }
]
b.	get by id ( GET ) : https://virlo.vercel.app/pricing/{id}

c.	delete by id ( Delete ) for admin dashbord only : : https://virlo.vercel.app/pricing/{id}
d.	update pricing for admin dashbord only (PUT): https://virlo.vercel.app/pricing/{id}
e.	add pricing for admin dashbord only  (post) : https://virlo.vercel.app/pricing
4.	reviews in listing for users 
a.	get review for any listing (GET) : https://virlo.vercel.app /api/reviews/67ab7fdae9fc0bcda8726b39?page=1&limit=2

params is 
page and limit 

response : 
{
    "message": "Reviews retrieved successfully",
    "reviews": [
        {
            "_id": "67ab8ef254aace716f867c9f",
            "listingId": "67ab7fdae9fc0bcda8726b39",
            "serviceRating": 5,
            "moneyRating": 4,
            "cleanlinessRating": 5,
            "locationRating": 4,
            "reviewerName": "John Doe",
            "reviewerEmail": "johndoe@example.com",
            "reviewText": "hello i want to say these is great listing",
            "createdAt": "2025-02-11T17:54:58.815Z",
            "updatedAt": "2025-02-11T17:54:58.815Z"
        }
    ],
    "averages": {
        "serviceAvg": 5,
        "moneyAvg": 4,
        "cleanlinessAvg": 5,
        "locationAvg": 4,
        "totalAverage": 4.5
    },
    "pagination": {
        "totalReviews": 1,
        "totalPages": 1,
        "currentPage": 1,
        "limit": 2
    }
}
b.	Create Review (post) for users in listing details : 
https://virlo.vercel.app /api/reviews/67ab7fdae9fc0bcda8726b39
	Request : 
	{
  "serviceRating": 5,
  "moneyRating": 4,
  "cleanlinessRating": 5,
  "locationRating": 4,
  "reviewerName": "John Doe",
  "reviewerEmail": "johndoe@example.com",
  "reviewText": "hello i want to say these is great listing"
}
Response : 
{
    "message": "Review added successfully",
    "newReview": {
        "listingId": "67ab7fdae9fc0bcda8726b39",
        "serviceRating": 5,
        "moneyRating": 4,
        "cleanlinessRating": 5,
        "locationRating": 4,
        "reviewerName": "John Doe",
        "reviewerEmail": "johndoe@example.com",
        "reviewText": "hello i want to say these is great listing",
        "_id": "67b7e8480e74e45bfabefbbb",
        "createdAt": "2025-02-21T02:43:20.178Z",
        "updatedAt": "2025-02-21T02:43:20.178Z"
    }
}
c.	Update review ( PATCH ) : https://virlo.vercel.app /api/reviews/64a000000000000000000002
Request : 
{
  "serviceRating": 5,
  "moneyRating": 4,
  "cleanlinessRating": 5,
  "locationRating": 4,
  "reviewerName": "John Doe",
  "reviewerEmail": "johndoe@example.com",
  "reviewText": "hello i want to say these is great listing"
}

Response : 
{
    "message": "Review updated successfully",
    "review": {
        "_id": "64a000000000000000000002",
        "listingId": "64a000000000000000000010",
        "serviceRating": 5,
        "moneyRating": 4,
        "cleanlinessRating": 5,
        "locationRating": 4,
        "reviewText": "hello i want to say these is great listing",
        "createdAt": "2025-02-09T12:00:00.000Z",
        "updatedAt": "2025-02-21T02:43:48.891Z",
        "reviewerEmail": "johndoe@example.com",
        "reviewerName": "John Doe"
    }
}

d.	Delete review ( DELETE ) for admin and review writer :  https://virlo.vercel.app / api/reviews/64a000000000000000000010

5.	Categories : 
a.	Add Category for admins only ( post ) : :  https://virlo.vercel.app /categories
Request : 
{
    "categoryName":"test1",
    "iconOne":"",
    "iconTwo":"",
    "amenities":["s","d"]
}
b.	Update Category for admins only ( PUT ) : https://virlo.vercel.app /categories/{id}
c.	Get All Categories (GET) : https://virlo.vercel.app/categories
Response : 
[
    {
        "_id": "67ae1e66c57141f547bc1f47",
        "categoryName": "Accountant",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Free initial consultation",
            "Online appointment scheduling",
            "Client portal for document sharing",
            "Tax preparation software access",
            "Financial planning seminars",
            "Personalized financial reports",
            "Year-round tax advice hotline",
            "Secure electronic document storage",
            "Monthly newsletters on tax updates",
            "In-house bookkeeping services"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f48",
        "categoryName": "Bakery Shop",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Free Wi-Fi for customers",
            "Seating area with comfortable furniture",
            "Loyalty rewards program",
            "Custom cake and pastry ordering",
            "Baking classes for kids and adults",
            "Seasonal and festive goodies",
            "Delivery service for large orders",
            "Gluten-free and vegan options",
            "Outdoor seating in nice weather",
            "Take-home recipe cards for popular items"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f49",
        "categoryName": "Dentist",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Flexible evening and weekend hours",
            "Sedation options for anxious patients",
            "In-office dental plan for uninsured patients",
            "Children’s play area with toys/games",
            "Digital X-rays for faster results",
            "Emergency dental services",
            "Teeth whitening services",
            "Preventative care education materials",
            "Payment plans for expensive procedures",
            "Referral program with discounts"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f4a",
        "categoryName": "Restaurant",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Outdoor patio or rooftop dining",
            "Takeout and delivery options via app",
            "Happy hour drink and food specials",
            "Themed nights (e.g., trivia, live music)",
            "Kids’ menu with healthy options",
            "Private dining rooms for events",
            "Cooking classes or chef’s table events",
            "Nutritional information available on menus",
            "Seasonal menu changes based on local produce",
            "Reservation system through website/app"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f4b",
        "categoryName": "Insurance",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Free quotes and policy comparisons",
            "Educational webinars on insurance types",
            "24/7 hotline for claims assistance",
            "Mobile app for policy management",
            "Coverage reviews with no cost",
            "Discounts for bundling policies",
            "Personalized coverage recommendations",
            "Community outreach events on insurance literacy",
            "Claims tracking via SMS updates",
            "Easy online claim submission process"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f4c",
        "categoryName": "Home Repairs",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "24/7 emergency repair service",
            "Free home inspections and estimates",
            "Maintenance reminder services",
            "Eco-friendly material options",
            "Highly trained service technicians",
            "Warranty on labor and parts",
            "Seasonal home maintenance tips and checklists",
            "Financing options for large projects",
            "After-hours customer support",
            "Referral bonuses for client recommendations"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f4d",
        "categoryName": "Immigration Lawyer",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Free initial consultation",
            "Multilingual support staff",
            "Resource library with immigration articles",
            "Workshops on Visa application processes",
            "Case tracking system for clients",
            "Regular updates on immigration law changes",
            "Community support groups for immigrants",
            "Flexible payment plans for services",
            "Assistance with legal document preparation",
            "In-person and virtual appointments"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f4e",
        "categoryName": "Family Doctor",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Same-day appointment availability",
            "Online patient portal to access records",
            "Telehealth consultations for convenience",
            "Health and wellness workshops",
            "Child-friendly environment with play areas",
            "Preventative care and health screenings",
            "Nutrition and diet counseling",
            "Same-day lab results for test screenings",
            "Extended office hours during weekdays",
            "Referral services to specialists"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f4f",
        "categoryName": "Teller",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Friendly and knowledgeable staff",
            "Extended banking hours (early or late)",
            "Personalized financial advice during visits",
            "Automated services for faster transactions",
            "Free banking consultations for new clients",
            "Remote deposit capture services",
            "Bilingual services available",
            "Regular financial literacy workshops",
            "Mobile banking app and support",
            "No-fee account options for students/seniors"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f50",
        "categoryName": "Present (Gift Shop)",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Custom gift wrapping services",
            "Same-day delivery options for local orders",
            "Gift registry functionality",
            "Loyalty program for frequent shoppers",
            "Personalized message cards included",
            "Workshops for DIY gift-making",
            "Seasonal promotions and discounts",
            "Event planning assistance for large gifts",
            "Eco-friendly and sustainable product lines",
            "Online gift suggestions based on interests"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f51",
        "categoryName": "Supermarket",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Loyalty card with exclusive discounts",
            "Home delivery and curbside pickup options",
            "Kitchen and cooking classes",
            "Organic and locally sourced product sections",
            "In-store pharmacy with health consultations",
            "Monthly in-store events (tastings, demos)",
            "Free parking for customers",
            "Prepared meals and deli services",
            "Family-friendly discounts on kids’ products",
            "Bulk purchasing discounts for large families"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f52",
        "categoryName": "Dessert Shop",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Sample tastings for new desserts",
            "Seasonal and limited-time offerings",
            "Customizable dessert orders for events",
            "Vegan and gluten-free dessert options",
            "Dessert catering for weddings and parties",
            "Loyalty punch card for frequent buyers",
            "Recipe sharing and baking tips",
            "Delivery services for bulk orders",
            "Kids' baking classes or workshops",
            "A cozy seating area with board games"
        ]
    },
    {
        "_id": "67ae1e66c57141f547bc1f53",
        "categoryName": "Translation",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Free initial consultation for new clients",
            "Certified translation services for legal documents",
            "Localization services for businesses",
            "Rush delivery for urgent translation requests",
            "Multilingual support staff available",
            "Online portal for project tracking",
            "Document formatting and typesetting services",
            "Cultural consultation for business practices",
            "Ongoing support for long-term projects",
            "Educational resources on language learning"
        ]
    }
]
d.	Get specific Category ( GET ) : https://virlo.vercel.app /categories/67ae1e66c57141f547bc1f4a
Response : 
{
    "_id": "67ae1e66c57141f547bc1f4a",
    "categoryName": "Restaurant",
    "iconOne": "",
    "iconTwo": "",
    "amenities": [
        "Outdoor patio or rooftop dining",
        "Takeout and delivery options via app",
        "Happy hour drink and food specials",
        "Themed nights (e.g., trivia, live music)",
        "Kids’ menu with healthy options",
        "Private dining rooms for events",
        "Cooking classes or chef’s table events",
        "Nutritional information available on menus",
        "Seasonal menu changes based on local produce",
        "Reservation system through website/app"
    ]
}
e.	Remove Category ( DELETE ) for admin dashboard only : https://virlo.vercel.app /categories/{id}
6.	Listing APIS 
a.	Get listing by pagination and filteration back-end logic (GET) : 
i.	https://virlo.vercel.app/listing/?lastValue=1
ii.	https://virlo.vercel.app/listing/?lastValue=1&name=My&location=New York
iii.	https://virlo.vercel.app/listing/?lastValue=1&name=My&location=New York&categoryId=67ae1e66c57141f547bc1f47
Params : 
o	lasValue = 1 to get 4 items , lastValue=2 to get 5 items , lastValue=3 to get 6 items and so on
o	name:
o location  :
o	categoryId
response Example : 
{
    "listings": [
        {
            "_id": "67ab7fdae9fc0bcda8726b39",
            "userId": "67a899f51909bc60ccdc26a7",
            "listingName": "My New Listing",
            "categoryId": {
                "_id": "67ae1e66c57141f547bc1f47",
                "categoryName": "Accountant",
                "iconOne": "",
                "iconTwo": "",
                "amenities": [
                    "Free initial consultation",
                    "Online appointment scheduling",
                    "Client portal for document sharing",
                    "Tax preparation software access",
                    "Financial planning seminars",
                    "Personalized financial reports",
                    "Year-round tax advice hotline",
                    "Secure electronic document storage",
                    "Monthly newsletters on tax updates",
                    "In-house bookkeeping services"
                ]
            },
            "location": "New York",
            "longitude": "-74.0060",
            "latitude": "40.7128",
            "reviewIds": [],
            "mainImage": null,
            "description": "A great place to stay!",
            "amenitielsList": [
                "Free initial consultation",
                "Online appointment scheduling",
                "Client portal for document sharing",
                "Tax preparation software access",
                "Financial planning seminars",
                "Personalized financial reports",
                "Year-round tax advice hotline",
                "Secure electronic document storage",
                "Monthly newsletters on tax updates",
                "In-house bookkeeping services"
            ],
            "itemsIds": [],
            "isActive": true,
            "gallery": [],
            "email": "owner@example.com",
            "activeDue": "2025-03-11T17:23:04.659Z",
            "mobile": "123456789",
            "taxNumber": "12345",
            "isPosted": true,
            "openingTimes": {
                "Monday": {
                    "status": "open",
                    "from": "10:00",
                    "to": "12:00"
                },
                "Tuesday": {
                    "status": "close",
                    "closingReason": "Holiday"
                },
                "Wednesday": {
                    "status": "open",
                    "from": "08:00",
                    "to": "16:00"
                },
                "Thursday": {
                    "status": "open",
                    "from": "10:00",
                    "to": "12:00"
                },
                "Friday": {
                    "status": "close",
                    "closingReason": "Holiday"
                },
                "Saturday": {
                    "status": "open",
                    "from": "08:00",
                    "to": "16:00"
                },
                "Sunday": {
                    "status": "open",
                    "from": "08:00",
                    "to": "16:00"
                },
                "_id": "67ab7fdae9fc0bcda8726b3a"
            },
            "socialMediaAccounts": [],
            "createdAt": "2025-02-11T16:50:34.995Z",
            "updatedAt": "2025-02-13T16:36:38.006Z",
            "postActiveDue": "2025-02-18T17:24:48.102Z"
        },
        {
            "_id": "67ab7febe9fc0bcda8726b41",
            "userId": "67a899f51909bc60ccdc26a7",
            "listingName": "My New Listing",
            "categoryId": {
                "_id": "67ae1e66c57141f547bc1f47",
                "categoryName": "Accountant",
                "iconOne": "",
                "iconTwo": "",
                "amenities": [
                    "Free initial consultation",
                    "Online appointment scheduling",
                    "Client portal for document sharing",
                    "Tax preparation software access",
                    "Financial planning seminars",
                    "Personalized financial reports",
                    "Year-round tax advice hotline",
                    "Secure electronic document storage",
                    "Monthly newsletters on tax updates",
                    "In-house bookkeeping services"
                ]
            },
            "location": "New York",
            "longitude": "-74.0060",
            "latitude": "40.7128",
            "reviewIds": [],
            "mainImage": null,
            "description": "A great place to stay!",
            "amenitielsList": [
                "Free initial consultation",
                "Online appointment scheduling",
                "Client portal for document sharing",
                "Tax preparation software access",
                "Financial planning seminars",
                "Personalized financial reports",
                "Year-round tax advice hotline",
                "Secure electronic document storage",
                "Monthly newsletters on tax updates",
                "In-house bookkeeping services"
            ],
            "itemsIds": [],
            "isActive": true,
            "gallery": [],
            "email": "owner@example.com",
            "mobile": "123456789",
            "taxNumber": "12345",
            "isPosted": false,
            "postActiveDue": null,
            "openingTimes": {
                "Monday": {
                    "status": "open",
                    "from": "10:00",
                    "to": "12:00"
                },
                "Tuesday": {
                    "status": "close",
                    "closingReason": "Holiday"
                },
                "Wednesday": {
                    "status": "open",
                    "from": "08:00",
                    "to": "16:00"
                },
                "Thursday": {
                    "status": "open",
                    "from": "10:00",
                    "to": "12:00"
                },
                "Friday": {
                    "status": "close",
                    "closingReason": "Holiday"
                },
                "Saturday": {
                    "status": "open",
                    "from": "08:00",
                    "to": "16:00"
                },
                "Sunday": {
                    "status": "open",
                    "from": "08:00",
                    "to": "16:00"
                },
                "_id": "67ab7febe9fc0bcda8726b42"
            },
            "socialMediaAccounts": [],
            "createdAt": "2025-02-11T16:50:51.934Z",
            "updatedAt": "2025-02-13T16:37:19.169Z"
        }
    ],
    "lastValue": 4,
    "totalItems": 2
}
b.	Get listing by id (GET) : https://virlo.vercel.app /listing/67aa20487229217d95baff5f
Response :
i.	If not exist : 200 OK
{
    "message": "Listing is not found"
}
ii.	If Exist : 200 OK
{
    "_id": "67ab7fdae9fc0bcda8726b39",
    "userId": "67a899f51909bc60ccdc26a7",
    "listingName": "My New Listing",
    "categoryId": {
        "_id": "67ae1e66c57141f547bc1f47",
        "categoryName": "Accountant",
        "iconOne": "",
        "iconTwo": "",
        "amenities": [
            "Free initial consultation",
            "Online appointment scheduling",
            "Client portal for document sharing",
            "Tax preparation software access",
            "Financial planning seminars",
            "Personalized financial reports",
            "Year-round tax advice hotline",
            "Secure electronic document storage",
            "Monthly newsletters on tax updates",
            "In-house bookkeeping services"
        ]
    },
    "location": "New York",
    "longitude": "-74.0060",
    "latitude": "40.7128",
    "reviewIds": [],
    "mainImage": null,
    "description": "A great place to stay!",
    "amenitielsList": [
        "Free initial consultation",
        "Online appointment scheduling",
        "Client portal for document sharing",
        "Tax preparation software access",
        "Financial planning seminars",
        "Personalized financial reports",
        "Year-round tax advice hotline",
        "Secure electronic document storage",
        "Monthly newsletters on tax updates",
        "In-house bookkeeping services"
    ],
    "itemsIds": [],
    "isActive": true,
    "gallery": [],
    "email": "owner@example.com",
    "activeDue": "2025-03-11T17:23:04.659Z",
    "mobile": "123456789",
    "taxNumber": "12345",
    "isPosted": true,
    "openingTimes": {
        "Monday": {
            "status": "open",
            "from": "10:00",
            "to": "12:00"
        },
        "Tuesday": {
            "status": "close",
            "closingReason": "Holiday"
        },
        "Wednesday": {
            "status": "open",
            "from": "08:00",
            "to": "16:00"
        },
        "Thursday": {
            "status": "open",
            "from": "10:00",
            "to": "12:00"
        },
        "Friday": {
            "status": "close",
            "closingReason": "Holiday"
        },
        "Saturday": {
            "status": "open",
            "from": "08:00",
            "to": "16:00"
        },
        "Sunday": {
            "status": "open",
            "from": "08:00",
            "to": "16:00"
        },
        "_id": "67ab7fdae9fc0bcda8726b3a"
    },
    "socialMediaAccounts": [],
    "createdAt": "2025-02-11T16:50:34.995Z",
    "updatedAt": "2025-02-13T16:36:38.006Z",
    "postActiveDue": "2025-02-18T17:24:48.102Z"
}
c.	Get user Listing (GET ) : https://virlo.vercel.app/listing/user
Header : Token ( eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoibW9tZW4iLCJlbWFpbCI6Im1vbWVuc2FsZWgyNDY4QGdtYWlsLmNvbSIsInVzZXJJZCI6IjY3YTg5OWY1MTkwOWJjNjBjY2RjMjZhNyIsImlhdCI6MTczOTIwMTU0OX0.ZECKy5Bag0hPSphNaJlsI5zshlIx11l9FNu0RmbXg_g ) 

response : [
    {
        "_id": "67ab7fdae9fc0bcda8726b39",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "My New Listing",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f47",
            "categoryName": "Accountant",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Free initial consultation",
                "Online appointment scheduling",
                "Client portal for document sharing",
                "Tax preparation software access",
                "Financial planning seminars",
                "Personalized financial reports",
                "Year-round tax advice hotline",
                "Secure electronic document storage",
                "Monthly newsletters on tax updates",
                "In-house bookkeeping services"
            ]
        },
        "location": "New York",
        "longitude": "-74.0060",
        "latitude": "40.7128",
        "reviewIds": [],
        "mainImage": null,
        "description": "A great place to stay!",
        "amenitielsList": [
            "Free initial consultation",
            "Online appointment scheduling",
            "Client portal for document sharing",
            "Tax preparation software access",
            "Financial planning seminars",
            "Personalized financial reports",
            "Year-round tax advice hotline",
            "Secure electronic document storage",
            "Monthly newsletters on tax updates",
            "In-house bookkeeping services"
        ],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "owner@example.com",
        "activeDue": "2025-03-11T17:23:04.659Z",
        "mobile": "123456789",
        "taxNumber": "12345",
        "isPosted": true,
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "10:00",
                "to": "12:00"
            },
            "Tuesday": {
                "status": "close",
                "closingReason": "Holiday"
            },
            "Wednesday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Thursday": {
                "status": "open",
                "from": "10:00",
                "to": "12:00"
            },
            "Friday": {
                "status": "close",
                "closingReason": "Holiday"
            },
            "Saturday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Sunday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "_id": "67ab7fdae9fc0bcda8726b3a"
        },
        "socialMediaAccounts": [],
        "createdAt": "2025-02-11T16:50:34.995Z",
        "updatedAt": "2025-02-13T16:36:38.006Z",
        "postActiveDue": "2025-02-18T17:24:48.102Z"
    },
    {
        "_id": "67ab7febe9fc0bcda8726b41",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "My New Listing",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f47",
            "categoryName": "Accountant",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Free initial consultation",
                "Online appointment scheduling",
                "Client portal for document sharing",
                "Tax preparation software access",
                "Financial planning seminars",
                "Personalized financial reports",
                "Year-round tax advice hotline",
                "Secure electronic document storage",
                "Monthly newsletters on tax updates",
                "In-house bookkeeping services"
            ]
        },
        "location": "New York",
        "longitude": "-74.0060",
        "latitude": "40.7128",
        "reviewIds": [],
        "mainImage": null,
        "description": "A great place to stay!",
        "amenitielsList": [
            "Free initial consultation",
            "Online appointment scheduling",
            "Client portal for document sharing",
            "Tax preparation software access",
            "Financial planning seminars",
            "Personalized financial reports",
            "Year-round tax advice hotline",
            "Secure electronic document storage",
            "Monthly newsletters on tax updates",
            "In-house bookkeeping services"
        ],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "owner@example.com",
        "mobile": "123456789",
        "taxNumber": "12345",
        "isPosted": false,
        "postActiveDue": null,
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "10:00",
                "to": "12:00"
            },
            "Tuesday": {
                "status": "close",
                "closingReason": "Holiday"
            },
            "Wednesday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Thursday": {
                "status": "open",
                "from": "10:00",
                "to": "12:00"
            },
            "Friday": {
                "status": "close",
                "closingReason": "Holiday"
            },
            "Saturday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Sunday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "_id": "67ab7febe9fc0bcda8726b42"
        },
        "socialMediaAccounts": [],
        "createdAt": "2025-02-11T16:50:51.934Z",
        "updatedAt": "2025-02-13T16:37:19.169Z"
    },
    {
        "_id": "67b4baf16627ba075c948f13",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "My New Listing",
        "categoryId": null,
        "location": "New York",
        "longitude": "-74.0060",
        "latitude": "40.7128",
        "reviewIds": [],
        "mainImage": null,
        "description": "A great place to stay!",
        "amenitielsList": [],
        "itemsIds": [
            {
                "_id": "67b4baf16627ba075c948f16",
                "name": "Item 1",
                "price": 50,
                "listingId": "67b4baf16627ba075c948f13",
                "createdAt": "2025-02-18T16:53:05.762Z",
                "updatedAt": "2025-02-18T16:53:05.762Z"
            },
            {
                "_id": "67b4baf16627ba075c948f17",
                "name": "Item 2",
                "price": 100,
                "listingId": "67b4baf16627ba075c948f13",
                "createdAt": "2025-02-18T16:53:05.762Z",
                "updatedAt": "2025-02-18T16:53:05.762Z"
            }
        ],
        "isActive": true,
        "gallery": [],
        "email": "owner@example.com",
        "mobile": "123456789",
        "taxNumber": "12345",
        "isPosted": false,
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "10:00",
                "to": "12:00"
            },
            "Tuesday": {
                "status": "close",
                "closingReason": "Holiday"
            },
            "Wednesday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Thursday": {
                "status": "open",
                "from": "10:00",
                "to": "12:00"
            },
            "Friday": {
                "status": "close",
                "closingReason": "Holiday"
            },
            "Saturday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Sunday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "_id": "67b4baf16627ba075c948f14"
        },
        "socialMediaAccounts": [],
        "createdAt": "2025-02-18T16:53:05.592Z",
        "updatedAt": "2025-02-18T16:53:05.931Z"
    },
    {
        "_id": "67ab7fdae9fc0bcda8726b43",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "London Tax Solutions",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f48",
            "categoryName": "Bakery Shop",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Free Wi-Fi for customers",
                "Seating area with comfortable furniture",
                "Loyalty rewards program",
                "Custom cake and pastry ordering",
                "Baking classes for kids and adults",
                "Seasonal and festive goodies",
                "Delivery service for large orders",
                "Gluten-free and vegan options",
                "Outdoor seating in nice weather",
                "Take-home recipe cards for popular items"
            ]
        },
        "location": "London",
        "longitude": "-0.1278",
        "latitude": "51.5074",
        "reviewIds": [],
        "mainImage": null,
        "description": "Your go-to tax advisors in London.",
        "amenitielsList": [],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "londontax@example.com",
        "mobile": "987654321",
        "taxNumber": "LON67890",
        "isPosted": false,
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "09:00",
                "to": "17:00"
            },
            "Tuesday": {
                "status": "open",
                "from": "09:00",
                "to": "17:00"
            },
            "Wednesday": {
                "status": "open",
                "from": "09:00",
                "to": "17:00"
            },
            "Thursday": {
                "status": "open",
                "from": "09:00",
                "to": "17:00"
            },
            "Friday": {
                "status": "close"
            },
            "Saturday": {
                "status": "open",
                "from": "10:00",
                "to": "14:00"
            },
            "Sunday": {
                "status": "close"
            },
            "_id": "67b4bb5b6627ba075c948f1f"
        },
        "createdAt": "2025-02-18T10:00:00.000Z",
        "updatedAt": "2025-02-18T10:00:00.000Z",
        "socialMediaAccounts": []
    },
    {
        "_id": "67ab7fdae9fc0bcda8726b40",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "Elite Tax Services",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f47",
            "categoryName": "Accountant",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Free initial consultation",
                "Online appointment scheduling",
                "Client portal for document sharing",
                "Tax preparation software access",
                "Financial planning seminars",
                "Personalized financial reports",
                "Year-round tax advice hotline",
                "Secure electronic document storage",
                "Monthly newsletters on tax updates",
                "In-house bookkeeping services"
            ]
        },
        "location": "Los Angeles",
        "longitude": "-118.2437",
        "latitude": "34.0522",
        "reviewIds": [],
        "mainImage": null,
        "description": "Your trusted partner for tax preparation.",
        "amenitielsList": [],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "elitetax@example.com",
        "mobile": "0987654321",
        "taxNumber": "LA54321",
        "isPosted": false,
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "10:00",
                "to": "18:00"
            },
            "Tuesday": {
                "status": "open",
                "from": "10:00",
                "to": "18:00"
            },
            "Wednesday": {
                "status": "open",
                "from": "10:00",
                "to": "18:00"
            },
            "Thursday": {
                "status": "open",
                "from": "10:00",
                "to": "18:00"
            },
            "Friday": {
                "status": "close"
            },
            "Saturday": {
                "status": "open",
                "from": "10:00",
                "to": "14:00"
            },
            "Sunday": {
                "status": "close"
            },
            "_id": "67b4bbdb6627ba075c948f27"
        },
        "createdAt": "2025-02-12T16:50:34.995Z",
        "updatedAt": "2025-02-12T16:50:34.995Z",
        "socialMediaAccounts": []
    },
    {
        "_id": "67ab7fdae9fc0bcda8726b41",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "Tax Advisory Group",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f47",
            "categoryName": "Accountant",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Free initial consultation",
                "Online appointment scheduling",
                "Client portal for document sharing",
                "Tax preparation software access",
                "Financial planning seminars",
                "Personalized financial reports",
                "Year-round tax advice hotline",
                "Secure electronic document storage",
                "Monthly newsletters on tax updates",
                "In-house bookkeeping services"
            ]
        },
        "location": "Chicago",
        "longitude": "-87.6298",
        "latitude": "41.8781",
        "reviewIds": [],
        "mainImage": null,
        "description": "Professional tax advice and strategies for businesses.",
        "amenitielsList": [],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "taxadvisory@example.com",
        "mobile": "1122334455",
        "taxNumber": "CHIC67890",
        "isPosted": false,
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "09:00",
                "to": "17:00"
            },
            "Tuesday": {
                "status": "open",
                "from": "09:00",
                "to": "17:00"
            },
            "Wednesday": {
                "status": "open",
                "from": "09:00",
                "to": "17:00"
            },
            "Thursday": {
                "status": "open",
                "from": "09:00",
                "to": "17:00"
            },
            "Friday": {
                "status": "open",
                "from": "09:00",
                "to": "15:00"
            },
            "Saturday": {
                "status": "close"
            },
            "Sunday": {
                "status": "close"
            },
            "_id": "67b4bbef6627ba075c948f2b"
        },
        "createdAt": "2025-02-12T16:50:51.934Z",
        "updatedAt": "2025-02-12T16:50:51.934Z",
        "socialMediaAccounts": []
    },
    {
        "_id": "67ab7fdae9fc0bcda8726b42",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "Financial Insights Consulting",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f47",
            "categoryName": "Accountant",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Free initial consultation",
                "Online appointment scheduling",
                "Client portal for document sharing",
                "Tax preparation software access",
                "Financial planning seminars",
                "Personalized financial reports",
                "Year-round tax advice hotline",
                "Secure electronic document storage",
                "Monthly newsletters on tax updates",
                "In-house bookkeeping services"
            ]
        },
        "location": "Houston",
        "longitude": "-95.3698",
        "latitude": "29.7604",
        "reviewIds": [],
        "mainImage": null,
        "description": "Your partner for financial clarity and guidance.",
        "amenitielsList": [],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "financialinsights@example.com",
        "mobile": "2233445566",
        "taxNumber": "HOU77543",
        "isPosted": false,
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Tuesday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Wednesday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Thursday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Friday": {
                "status": "open",
                "from": "08:00",
                "to": "15:00"
            },
            "Saturday": {
                "status": "close"
            },
            "Sunday": {
                "status": "close"
            },
            "_id": "67b4bbf96627ba075c948f2f"
        },
        "createdAt": "2025-02-12T16:50:51.995Z",
        "updatedAt": "2025-02-12T16:50:51.995Z",
        "socialMediaAccounts": []
    },
    {
        "_id": "67ab7fdae9fc0bcda8726b44",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "Summit Accounting Firm",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f47",
            "categoryName": "Accountant",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Free initial consultation",
                "Online appointment scheduling",
                "Client portal for document sharing",
                "Tax preparation software access",
                "Financial planning seminars",
                "Personalized financial reports",
                "Year-round tax advice hotline",
                "Secure electronic document storage",
                "Monthly newsletters on tax updates",
                "In-house bookkeeping services"
            ]
        },
        "location": "Seattle",
        "longitude": "-122.3321",
        "latitude": "47.6062",
        "reviewIds": [],
        "mainImage": null,
        "description": "Committed to helping you achieve financial success.",
        "amenitielsList": [],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "summitaccounting@example.com",
        "mobile": "5566778899",
        "taxNumber": "SEA98765",
        "isPosted": false,
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "09:00",
                "to": "16:00"
            },
            "Tuesday": {
                "status": "open",
                "from": "09:00",
                "to": "16:00"
            },
            "Wednesday": {
                "status": "open",
                "from": "09:00",
                "to": "16:00"
            },
            "Thursday": {
                "status": "open",
                "from": "09:00",
                "to": "16:00"
            },
            "Friday": {
                "status": "open",
                "from": "09:00",
                "to": "12:00"
            },
            "Saturday": {
                "status": "close"
            },
            "Sunday": {
                "status": "close"
            },
            "_id": "67b4bc106627ba075c948f37"
        },
        "createdAt": "2025-02-12T16:50:51.995Z",
        "updatedAt": "2025-02-12T16:50:51.995Z",
        "socialMediaAccounts": []
    },
    {
        "_id": "67ab7febe9fc1bcda8726b47",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "Culinary Academy",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f51",
            "categoryName": "Supermarket",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Loyalty card with exclusive discounts",
                "Home delivery and curbside pickup options",
                "Kitchen and cooking classes",
                "Organic and locally sourced product sections",
                "In-store pharmacy with health consultations",
                "Monthly in-store events (tastings, demos)",
                "Free parking for customers",
                "Prepared meals and deli services",
                "Family-friendly discounts on kids’ products",
                "Bulk purchasing discounts for large families"
            ]
        },
        "location": "New York",
        "longitude": "-74.0060",
        "latitude": "40.7128",
        "reviewIds": [],
        "mainImage": null,
        "description": "Learn from the best chefs in a fun environment!",
        "amenitielsList": [
            "Hands-on cooking classes",
            "Chef demonstrations",
            "Recipe booklets",
            "Wine pairing sessions",
            "Gourmet tastings"
        ],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "info@culinaryacademy.com",
        "activeDue": "2025-07-10T17:23:04.659Z",
        "mobile": "4564564567",
        "taxNumber": "88888",
        "isPosted": true,
        "socialMediaAccounts": [],
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "10:00",
                "to": "20:00"
            },
            "Tuesday": {
                "status": "open",
                "from": "10:00",
                "to": "20:00"
            },
            "Wednesday": {
                "status": "open",
                "from": "10:00",
                "to": "20:00"
            },
            "Thursday": {
                "status": "open",
                "from": "10:00",
                "to": "20:00"
            },
            "Friday": {
                "status": "open",
                "from": "10:00",
                "to": "20:00"
            },
            "Saturday": {
                "status": "open",
                "from": "09:00",
                "to": "16:00"
            },
            "Sunday": {
                "status": "close",
                "closingReason": "Private Events"
            },
            "_id": "67ab7febe9fc1bcda8726b48"
        },
        "createdAt": "2025-02-13T17:00:51.934Z",
        "updatedAt": "2025-02-13T17:00:51.934Z"
    },
    {
        "_id": "67ab7fdae9fc1bcda8726b45",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "Fitness Hub",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f50",
            "categoryName": "Present (Gift Shop)",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Custom gift wrapping services",
                "Same-day delivery options for local orders",
                "Gift registry functionality",
                "Loyalty program for frequent shoppers",
                "Personalized message cards included",
                "Workshops for DIY gift-making",
                "Seasonal promotions and discounts",
                "Event planning assistance for large gifts",
                "Eco-friendly and sustainable product lines",
                "Online gift suggestions based on interests"
            ]
        },
        "location": "Los Angeles",
        "longitude": "-118.2437",
        "latitude": "34.0522",
        "reviewIds": [],
        "mainImage": null,
        "description": "A modern fitness center for all your workout needs!",
        "amenitielsList": [
            "Personal training sessions",
            "Group classes",
            "Free trial membership",
            "Nutritional counseling",
            "Spa services"
        ],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "info@fitnesshub.com",
        "activeDue": "2025-06-20T17:23:04.659Z",
        "mobile": "3213213210",
        "taxNumber": "77777",
        "isPosted": true,
        "postActiveDue": "2025-03-25T17:24:48.102Z",
        "socialMediaAccounts": [],
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "06:00",
                "to": "22:00"
            },
            "Tuesday": {
                "status": "open",
                "from": "06:00",
                "to": "22:00"
            },
            "Wednesday": {
                "status": "open",
                "from": "06:00",
                "to": "22:00"
            },
            "Thursday": {
                "status": "open",
                "from": "06:00",
                "to": "22:00"
            },
            "Friday": {
                "status": "open",
                "from": "06:00",
                "to": "22:00"
            },
            "Saturday": {
                "status": "open",
                "from": "08:00",
                "to": "20:00"
            },
            "Sunday": {
                "status": "close",
                "closingReason": "Maintenance"
            },
            "_id": "67ab7fdae9fc1bcda8726b46"
        },
        "createdAt": "2025-02-13T16:00:34.995Z",
        "updatedAt": "2025-02-13T16:00:34.995Z"
    },
    {
        "_id": "67ab7febe9fc1bcda8726b43",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "Gourmet Café",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f49",
            "categoryName": "Dentist",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Flexible evening and weekend hours",
                "Sedation options for anxious patients",
                "In-office dental plan for uninsured patients",
                "Children’s play area with toys/games",
                "Digital X-rays for faster results",
                "Emergency dental services",
                "Teeth whitening services",
                "Preventative care education materials",
                "Payment plans for expensive procedures",
                "Referral program with discounts"
            ]
        },
        "location": "Chicago",
        "longitude": "-87.6298",
        "latitude": "41.8781",
        "reviewIds": [],
        "mainImage": null,
        "description": "A cozy place to enjoy gourmet coffee and pastries!",
        "amenitielsList": [
            "Free Wi-Fi",
            "Outdoor seating",
            "Breakfast all day",
            "Pet-friendly",
            "Live music on weekends"
        ],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "contact@gourmetcafe.com",
        "activeDue": "2025-05-15T17:23:04.659Z",
        "mobile": "1231231234",
        "taxNumber": "54321",
        "isPosted": true,
        "socialMediaAccounts": [],
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "07:00",
                "to": "18:00"
            },
            "Tuesday": {
                "status": "open",
                "from": "07:00",
                "to": "18:00"
            },
            "Wednesday": {
                "status": "open",
                "from": "07:00",
                "to": "18:00"
            },
            "Thursday": {
                "status": "open",
                "from": "07:00",
                "to": "18:00"
            },
            "Friday": {
                "status": "open",
                "from": "07:00",
                "to": "22:00"
            },
            "Saturday": {
                "status": "open",
                "from": "08:00",
                "to": "22:00"
            },
            "Sunday": {
                "status": "open",
                "from": "08:00",
                "to": "20:00"
            },
            "_id": "67ab7febe9fc1bcda8726b44"
        },
        "createdAt": "2025-02-12T17:50:51.934Z",
        "updatedAt": "2025-02-12T17:50:51.934Z"
    },
    {
        "_id": "67ab7fdae9fc1bcda8726b40",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "Tech Solutions",
        "categoryId": {
            "_id": "67ae1e66c57141f547bc1f48",
            "categoryName": "Bakery Shop",
            "iconOne": "",
            "iconTwo": "",
            "amenities": [
                "Free Wi-Fi for customers",
                "Seating area with comfortable furniture",
                "Loyalty rewards program",
                "Custom cake and pastry ordering",
                "Baking classes for kids and adults",
                "Seasonal and festive goodies",
                "Delivery service for large orders",
                "Gluten-free and vegan options",
                "Outdoor seating in nice weather",
                "Take-home recipe cards for popular items"
            ]
        },
        "location": "San Francisco",
        "longitude": "-122.4194",
        "latitude": "37.7749",
        "reviewIds": [],
        "mainImage": null,
        "description": "Your go-to place for all tech solutions!",
        "amenitielsList": [
            "24/7 tech support",
            "Custom software development",
            "Cloud storage solutions",
            "Network security audits",
            "IT consulting services"
        ],
        "itemsIds": [],
        "isActive": true,
        "gallery": [],
        "email": "info@techsolutions.com",
        "activeDue": "2025-04-11T17:23:04.659Z",
        "mobile": "987654321",
        "taxNumber": "67890",
        "isPosted": true,
        "postActiveDue": "2025-03-20T17:24:48.102Z",
        "socialMediaAccounts": [],
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "09:00",
                "to": "18:00"
            },
            "Tuesday": {
                "status": "open",
                "from": "09:00",
                "to": "18:00"
            },
            "Wednesday": {
                "status": "open",
                "from": "09:00",
                "to": "18:00"
            },
            "Thursday": {
                "status": "open",
                "from": "09:00",
                "to": "18:00"
            },
            "Friday": {
                "status": "open",
                "from": "09:00",
                "to": "18:00"
            },
            "Saturday": {
                "status": "close",
                "closingReason": "Weekend"
            },
            "Sunday": {
                "status": "close",
                "closingReason": "Weekend"
            },
            "_id": "67ab7fdae9fc1bcda8726b3b"
        },
        "createdAt": "2025-02-12T16:50:34.995Z",
        "updatedAt": "2025-02-12T16:50:34.995Z"
    },
    {
        "_id": "67b73d36d5d7e3a2563764d0",
        "userId": "67a899f51909bc60ccdc26a7",
        "listingName": "test",
        "categoryId": null,
        "location": "New York",
        "longitude": "-74.0060",
        "latitude": "40.7128",
        "reviewIds": [],
        "mainImage": null,
        "description": "A great place to stay!",
        "amenitielsList": [],
        "itemsIds": [
            {
                "_id": "67b73d36d5d7e3a2563764d3",
                "name": "Item 1",
                "price": 50,
                "listingId": "67b73d36d5d7e3a2563764d0",
                "createdAt": "2025-02-20T14:33:26.665Z",
                "updatedAt": "2025-02-20T14:33:26.665Z"
            },
            {
                "_id": "67b73d36d5d7e3a2563764d4",
                "name": "Item 2",
                "price": 100,
                "listingId": "67b73d36d5d7e3a2563764d0",
                "createdAt": "2025-02-20T14:33:26.665Z",
                "updatedAt": "2025-02-20T14:33:26.665Z"
            }
        ],
        "isActive": false,
        "gallery": [],
        "email": "owner@example.com",
        "mobile": "123456789",
        "taxNumber": "12345",
        "isPosted": false,
        "openingTimes": {
            "Monday": {
                "status": "open",
                "from": "10:00",
                "to": "12:00"
            },
            "Tuesday": {
                "status": "close",
                "closingReason": "Holiday"
            },
            "Wednesday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Thursday": {
                "status": "open",
                "from": "10:00",
                "to": "12:00"
            },
            "Friday": {
                "status": "close",
                "closingReason": "Holiday"
            },
            "Saturday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "Sunday": {
                "status": "open",
                "from": "08:00",
                "to": "16:00"
            },
            "_id": "67b73d36d5d7e3a2563764d1"
        },
        "socialMediaAccounts": [],
        "createdAt": "2025-02-20T14:33:26.485Z",
        "updatedAt": "2025-02-20T14:33:26.833Z"
    }
]

d.	Remove listing ( DELETE ) : https://virlo.vercel.app/listing/67aa20487229217d95baff5f
Response : 
404Not Found
{
    "statusCode": 404,
    "message": "Listing not found"
}

Or 
200 OK
{
    "message": "Listing deleted successfully"
}
e.	Update listing ( PUT ) : https://virlo.vercel.app/listing/67ab4ed8604bcdce6743470b
Header : Token 

Request : 
{
  "listingName": "Updated Listing Name",
  "location": "Los Angeles",
  "items": [
    {
      "_id": "67a9ef61d7aecc72104f5365",
      "name": "Updated Item mmmm",
      "price": 75
    },
    {
      "_id": "67a9ef61d7aecc72104f5366",
      "name": "Updated Item 2",
      "price": 150
    },
    {
      "name": "New Item 3",
      "price": 200
    },
    {
      "name": "New Item 4",
      "price": 20055
    }
  ],
  "openingTimes": {
    "Monday": { "status": "open", "from": "10:00", "to": "12:00" },
    "Tuesday": { "status": "close", "closingReason": "Holiday" },
    "Wednesday": { "status": "open", "from": "08:00", "to": "16:00" },
    "Thursday": { "status": "open", "from": "10:00", "to": "12:00" },
    "Friday": { "status": "close", "closingReason": "Holidays" },
    "Saturday": { "status": "open", "from": "08:00", "to": "16:00" },
    "Sunday": { "status": "open", "from": "08:00", "to": "16:00" }
  }
}

Repones : 
404Not Found
 {
    "message": "Listing not found",
    "error": "Not Found",
    "statusCode": 404
}

Or 
200 OK
				{
    "_id": "67ab7febe9fc0bcda8726b41",
    "userId": "67a899f51909bc60ccdc26a7",
    "listingName": "Updated Listing Name",
    "categoryId": "67ae1e66c57141f547bc1f47",
    "location": "Los Angeles",
    "longitude": "-74.0060",
    "latitude": "40.7128",
    "reviewIds": [],
    "mainImage": null,
    "description": "A great place to stay!",
    "amenitielsList": [
        "Free initial consultation",
        "Online appointment scheduling",
        "Client portal for document sharing",
        "Tax preparation software access",
        "Financial planning seminars",
        "Personalized financial reports",
        "Year-round tax advice hotline",
        "Secure electronic document storage",
        "Monthly newsletters on tax updates",
        "In-house bookkeeping services"
    ],
    "itemsIds": [
        "67a9ef61d7aecc72104f5365",
        "67a9ef61d7aecc72104f5366",
        "67b7f116b0e55d0dcc95fcb4",
        "67b7f116b0e55d0dcc95fcb6"
    ],
    "isActive": true,
    "gallery": [],
    "email": "owner@example.com",
    "mobile": "123456789",
    "taxNumber": "12345",
    "isPosted": false,
    "postActiveDue": null,
    "openingTimes": {
        "Monday": {
            "status": "open",
            "from": "10:00",
            "to": "12:00"
        },
        "Tuesday": {
            "status": "close",
            "closingReason": "Holiday"
        },
        "Wednesday": {
            "status": "open",
            "from": "08:00",
            "to": "16:00"
        },
        "Thursday": {
            "status": "open",
            "from": "10:00",
            "to": "12:00"
        },
        "Friday": {
            "status": "close",
            "closingReason": "Holidays"
        },
        "Saturday": {
            "status": "open",
            "from": "08:00",
            "to": "16:00"
        },
        "Sunday": {
            "status": "open",
            "from": "08:00",
            "to": "16:00"
        },
        "_id": "67b7f117b0e55d0dcc95fcb9"
    },
    "socialMediaAccounts": [],
    "createdAt": "2025-02-11T16:50:51.934Z",
    "updatedAt": "2025-02-21T03:20:55.110Z"
}

f.	Add new listing (post) : https://virlo.vercel.app/listing
Header : token 
{  
    "_id": "67ab7fdae9fc1bcda8726b40",  
    "userId": "67a899f51909bc60ccdc26a8",  
    "listingName": "Tech Solutions",  
    "categoryId": {  
        "_id": "67ae1e66c57141f547bc1f48",  
        "categoryName": "IT Services",  
        "iconOne": "https://example.com/icon1.png",  
        "iconTwo": "https://example.com/icon2.png",  
        "amenities": [  
            "24/7 tech support",  
            "Custom software development",  
            "Cloud storage solutions",  
            "Network security audits",  
            "IT consulting services"  
        ]  
    },  
    "location": "San Francisco",  
    "longitude": "-122.4194",  
    "latitude": "37.7749",  
    "reviewIds": [],  
    "mainImage": "https://example.com/tech_solutions.jpg",  
    "description": "Your go-to place for all tech solutions!",  
    "amenitielsList": [  
        "24/7 tech support",  
        "Custom software development",  
        "Cloud storage solutions",  
        "Network security audits",  
        "IT consulting services"  
    ],  
    "itemsIds": [],  
    "isActive": true,  
    "gallery": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],  
    "email": "info@techsolutions.com",  
    "activeDue": "2025-04-11T17:23:04.659Z",  
    "mobile": "987654321",  
    "taxNumber": "67890",  
    "isPosted": true,  
    "openingTimes": {  
        "Monday": { "status": "open", "from": "09:00", "to": "18:00" },  
        "Tuesday": { "status": "open", "from": "09:00", "to": "18:00" },  
        "Wednesday": { "status": "open", "from": "09:00", "to": "18:00" },  
        "Thursday": { "status": "open", "from": "09:00", "to": "18:00" },  
        "Friday": { "status": "open", "from": "09:00", "to": "18:00" },  
        "Saturday": { "status": "close", "closingReason": "Weekend" },  
        "Sunday": { "status": "close", "closingReason": "Weekend" },  
        "_id": "67ab7fdae9fc1bcda8726b3b"  
    },  
    "socialMediaAccounts": [],  
    "createdAt": "2025-02-12T16:50:34.995Z",  
    "updatedAt": "2025-02-14T16:36:38.006Z",  
    "postActiveDue": "2025-03-20T17:24:48.102Z"  
}
Response : 
500Internal Server Error 
{
    "statusCode": 500,
    "message": "E11000 duplicate key error collection: directory.listings index: _id_ dup key: { _id: ObjectId('67ab7fdae9fc1bcda8726b40') }"
}


Or 
201 Created
{
    "userId": "67a899f51909bc60ccdc26a7",
    "listingName": "Tech Solutions",
    "categoryId": "67ae1e66c57141f547bc1f48",
    "location": "San Francisco",
    "longitude": "-122.4194",
    "latitude": "37.7749",
    "reviewIds": [],
    "mainImage": null,
    "description": "Your go-to place for all tech solutions!",
    "amenitielsList": [
        "24/7 tech support",
        "Custom software development",
        "Cloud storage solutions",
        "Network security audits",
        "IT consulting services"
    ],
    "itemsIds": [],
    "isActive": true,
    "gallery": [],
    "email": "info@techsolutions.com",
    "activeDue": "2025-04-11T17:23:04.659Z",
    "mobile": "987654321",
    "taxNumber": "67890",
    "isPosted": true,
    "postActiveDue": "2025-03-20T17:24:48.102Z",
    "socialMediaAccounts": [],
    "openingTimes": {
        "Monday": {
            "status": "open",
            "from": "09:00",
            "to": "18:00"
        },
        "Tuesday": {
            "status": "open",
            "from": "09:00",
            "to": "18:00"
        },
        "Wednesday": {
            "status": "open",
            "from": "09:00",
            "to": "18:00"
        },
        "Thursday": {
            "status": "open",
            "from": "09:00",
            "to": "18:00"
        },
        "Friday": {
            "status": "open",
            "from": "09:00",
            "to": "18:00"
        },
        "Saturday": {
            "status": "close",
            "closingReason": "Weekend"
        },
        "Sunday": {
            "status": "close",
            "closingReason": "Weekend"
        },
        "_id": "67ab7fdae9fc1bcda8726b3b"
    },
    "_id": "87ab7fdae9fc1bcda8726b40",
    "createdAt": "2025-02-12T16:50:34.995Z",
    "updatedAt": "2025-02-12T16:50:34.995Z"
}

