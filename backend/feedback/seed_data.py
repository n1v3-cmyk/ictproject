"""Static reference data for seeding (mirrors ``frontend/src/data/keralaData.ts``).

Departments/services and the Kerala district/taluk catalogue with coordinates.
The coordinates are the ones the frontend already uses, so the geographic view
looks identical against either adapter. Local areas outside this catalogue are
created with unknown (null) coordinates — never fabricated.
"""

from __future__ import annotations

STATE = "Kerala"

# name -> {"coordinates": (lat, lng), "taluks": [...]}
KERALA_DISTRICTS: list[dict] = [
    {
        "name": "Thiruvananthapuram",
        "coordinates": (8.5241, 76.9366),
        "taluks": [
            "Thiruvananthapuram",
            "Neyyattinkara",
            "Nedumangad",
            "Chirayinkeezhu",
            "Kattakada",
            "Varkala",
        ],
    },
    {
        "name": "Kollam",
        "coordinates": (8.8932, 76.6141),
        "taluks": [
            "Kollam",
            "Karunagappally",
            "Kunnathur",
            "Kottarakkara",
            "Punalur",
            "Pathanapuram",
        ],
    },
    {
        "name": "Pathanamthitta",
        "coordinates": (9.2648, 76.7870),
        "taluks": ["Kozhencherry", "Ranni", "Adoor", "Thiruvalla", "Mallappally", "Konni"],
    },
    {
        "name": "Alappuzha",
        "coordinates": (9.4981, 76.3388),
        "taluks": [
            "Ambalappuzha",
            "Kuttanad",
            "Cherthala",
            "Karthikappally",
            "Chengannur",
            "Mavelikkara",
        ],
    },
    {
        "name": "Kottayam",
        "coordinates": (9.5916, 76.5222),
        "taluks": ["Kottayam", "Changanassery", "Vaikom", "Meenachil", "Kanjirappally"],
    },
    {
        "name": "Idukki",
        "coordinates": (9.8494, 76.9806),
        "taluks": ["Devikulam", "Udumbanchola", "Thodupuzha", "Peerumade", "Idukki"],
    },
    {
        "name": "Ernakulam",
        "coordinates": (9.9816, 76.2999),
        "taluks": [
            "Kanayannur (Kochi)",
            "Kochi",
            "Aluva",
            "Paravur",
            "Kunnathunad",
            "Muvattupuzha",
            "Kothamangalam",
        ],
    },
    {
        "name": "Thrissur",
        "coordinates": (10.5276, 76.2144),
        "taluks": ["Thrissur", "Mukundapuram", "Kodungallur", "Chavakkad", "Thalapilly", "Chalakkudy"],
    },
    {
        "name": "Palakkad",
        "coordinates": (10.7867, 76.6548),
        "taluks": ["Palakkad", "Alathur", "Chittur", "Ottappalam", "Mannarkkad", "Pattambi"],
    },
    {
        "name": "Malappuram",
        "coordinates": (11.0510, 76.0711),
        "taluks": [
            "Eranad",
            "Tirur",
            "Tirurangadi",
            "Ponnani",
            "Perinthalmanna",
            "Nilambur",
            "Kondotty",
        ],
    },
    {
        "name": "Kozhikode",
        "coordinates": (11.2588, 75.7804),
        "taluks": ["Kozhikode", "Vadakara", "Quilandy", "Thamarassery"],
    },
    {
        "name": "Wayanad",
        "coordinates": (11.6854, 76.1320),
        "taluks": ["Vythiri", "Sulthan Bathery", "Mananthavady"],
    },
    {
        "name": "Kannur",
        "coordinates": (11.8745, 75.3704),
        "taluks": ["Kannur", "Thalassery", "Taliparamba", "Iritty", "Payyanur"],
    },
    {
        "name": "Kasaragod",
        "coordinates": (12.4996, 74.9869),
        "taluks": ["Kasaragod", "Hosdurg", "Vellarikundu", "Manjeshwaram"],
    },
]

DEPARTMENTS: list[dict] = [
    {
        "name": "Revenue & Land Records",
        "code": "REV",
        "icon_name": "Landmark",
        "description": (
            "Land mutation, possession certificates, revenue records, encumbrance, "
            "and caste/income verification."
        ),
        "contact_email": "revenue.helpdesk@kerala.gov.in",
        "nodal_officer": "Shri. Rajesh Kumar, Joint Commissioner",
        "services": [
            ("Land Mutation (Pokkuvaravu)", "REV-01", "Land Records", "Transfer of title and land registry updation."),
            ("Possession Certificate", "REV-02", "Certificates", "Issuance of a legal land possession certificate."),
            ("Income Certificate", "REV-03", "Certificates", "Official certification of annual household income."),
            ("Encumbrance Certificate", "REV-04", "Certificates", "Record of registered transactions on a property."),
            ("Caste Certificate", "REV-05", "Certificates", "Community certificate for eligible applicants."),
        ],
    },
    {
        "name": "Motor Vehicles Department (MVD)",
        "code": "MVD",
        "icon_name": "Car",
        "description": "Licensing, vehicle registration, permits, and transport enforcement.",
        "contact_email": "mvd.helpdesk@kerala.gov.in",
        "nodal_officer": "Smt. Anitha Menon, Transport Commissioner",
        "services": [
            ("Driving License Renewal", "MVD-01", "Licensing", "Renewal of an existing driving licence."),
            ("Vehicle Registration", "MVD-02", "Registration", "New vehicle registration and number allotment."),
            ("Learner's Licence", "MVD-03", "Licensing", "Application for a learner's licence."),
            ("Transfer of Ownership", "MVD-04", "Registration", "Transfer of a vehicle between owners."),
            ("Fitness Certificate", "MVD-05", "Certification", "Fitness certification for commercial vehicles."),
        ],
    },
    {
        "name": "Health & Family Welfare",
        "code": "HFW",
        "icon_name": "Stethoscope",
        "description": "Public health services, vital records, and hospital administration.",
        "contact_email": "health.helpdesk@kerala.gov.in",
        "nodal_officer": "Dr. Suresh Babu, Director of Health Services",
        "services": [
            ("Birth Certificate", "HFW-01", "Certificates", "Registration and issuance of a birth certificate."),
            ("Death Certificate", "HFW-02", "Certificates", "Registration and issuance of a death certificate."),
            ("Vaccination Record", "HFW-03", "Health Records", "Official immunisation record."),
            ("Government Hospital Appointment", "HFW-04", "Health Services", "Booking an appointment at a government hospital."),
        ],
    },
    {
        "name": "Civil Supplies & Consumer Affairs",
        "code": "CSCA",
        "icon_name": "ShoppingBag",
        "description": "Ration cards, public distribution, and consumer grievance redressal.",
        "contact_email": "civilsupplies.helpdesk@kerala.gov.in",
        "nodal_officer": "Shri. Vinod Thomas, Commissioner",
        "services": [
            ("Ration Card Application", "CSCA-01", "Ration", "Apply for a new ration card."),
            ("Ration Card Correction", "CSCA-02", "Ration", "Correct details on an existing ration card."),
            ("Priority Ration Card", "CSCA-03", "Ration", "Apply for a priority-category ration card."),
            ("Consumer Complaint", "CSCA-04", "Grievance", "Register a consumer complaint."),
        ],
    },
    {
        "name": "Local Self Government (LSGD)",
        "code": "LSGD",
        "icon_name": "Building2",
        "description": "Municipal services, permits, property tax, and local registrations.",
        "contact_email": "lsgd.helpdesk@kerala.gov.in",
        "nodal_officer": "Dr. Sarada Muraleedharan, Additional Chief Secretary",
        "services": [
            ("Building Permit", "LSGD-01", "Permits", "Permit for construction or renovation."),
            ("Property Tax Payment", "LSGD-02", "Revenue", "Payment of local property tax."),
            ("Trade Licence", "LSGD-03", "Licensing", "Licence to operate a trade or business."),
            ("Birth & Death Registration", "LSGD-04", "Registration", "Local registration of births and deaths."),
            ("Marriage Registration", "LSGD-05", "Registration", "Registration of marriages."),
        ],
    },
    {
        "name": "Kerala State Electricity Board (KSEB)",
        "code": "KSEB",
        "icon_name": "Zap",
        "description": "Electricity connections, billing, metering, and supply complaints.",
        "contact_email": "kseb.helpdesk@kseb.in",
        "nodal_officer": "Shri. B. Ashok, Chairman & Managing Director",
        "services": [
            ("New Electricity Connection", "KSEB-01", "Connections", "Apply for a new electricity connection."),
            ("Tariff Change", "KSEB-02", "Billing", "Request a change of tariff category."),
            ("Complaint Registration", "KSEB-03", "Grievance", "Register a supply or billing complaint."),
            ("Meter Replacement", "KSEB-04", "Metering", "Request replacement of a faulty meter."),
        ],
    },
    {
        "name": "Kerala Water Authority (KWA)",
        "code": "KWA",
        "icon_name": "Droplets",
        "description": "Water connections, billing, quality testing, and pipeline complaints.",
        "contact_email": "kwa.helpdesk@kwa.kerala.gov.in",
        "nodal_officer": "Shri. J. Chandrabose, Managing Director",
        "services": [
            ("New Water Connection", "KWA-01", "Connections", "Apply for a new water connection."),
            ("Water Bill Payment", "KWA-02", "Billing", "Pay an outstanding water bill."),
            ("Pipeline Complaint", "KWA-03", "Grievance", "Report a pipeline leak or supply issue."),
            ("Quality Testing Request", "KWA-04", "Quality", "Request water quality testing."),
        ],
    },
    {
        "name": "General Education Department",
        "code": "GED",
        "icon_name": "GraduationCap",
        "description": "School admissions, certificates, scholarships, and teacher services.",
        "contact_email": "education.helpdesk@kerala.gov.in",
        "nodal_officer": "Smt. Rani George, Secretary",
        "services": [
            ("School Admission Enquiry", "GED-01", "Admissions", "Enquiry about school admissions."),
            ("Transfer Certificate", "GED-02", "Certificates", "Issuance of a school transfer certificate."),
            ("Scholarship Application", "GED-03", "Scholarships", "Apply for a student scholarship."),
            ("Teacher Grievance", "GED-04", "Grievance", "Register a grievance as a teacher."),
        ],
    },
]
