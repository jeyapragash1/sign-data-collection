"""Explicit setup commands; demo records never represent real people or videos."""
import argparse
import getpass
import hashlib
import json
import secrets
import time

from sqlalchemy import func, select

from .db import *
from .main import passwords


DEMO_PROMPTS = [
    ("உங்கள் பெயரை இங்கே பதிவு செய்யுங்கள்.", "Register your name here.", "ඔබගේ නම මෙහි ලියාපදිංචි කරන්න.", "hospital"),
    ("தயவுசெய்து உங்கள் அடையாள அட்டையைக் காட்டுங்கள்.", "Please show your identity card.", "කරුණාකර ඔබගේ හැඳුනුම්පත පෙන්වන්න.", "hospital"),
    ("மருத்துவரைச் சந்திக்க இங்கே காத்திருக்கவும்.", "Wait here to see the doctor.", "වෛද්‍යවරයා හමුවීමට මෙහි රැඳී සිටින්න.", "hospital"),
    ("உங்கள் மருத்துவ அறிக்கையை எடுத்து வாருங்கள்.", "Bring your medical report.", "ඔබගේ වෛද්‍ය වාර්තාව රැගෙන එන්න.", "hospital"),
    ("மருந்தை உணவுக்குப் பிறகு எடுத்துக்கொள்ளுங்கள்.", "Take the medicine after food.", "ආහාර ගැනීමෙන් පසු ඖෂධ ලබා ගන්න.", "hospital"),
    ("யாழ்ப்பாணம் செல்லும் பேருந்து எப்போது வரும்?", "When will the bus to Jaffna arrive?", "යාපනයට යන බස් රථය පැමිණෙන්නේ කවදාද?", "transport"),
    ("எனக்கு இரண்டு பயணச்சீட்டுகள் வேண்டும்.", "I need two tickets.", "මට ප්‍රවේශපත්‍ර දෙකක් අවශ්‍යයි.", "transport"),
    ("இந்தப் பேருந்தில் இப்போது ஏற வேண்டாம்.", "Do not board this bus now.", "දැන් මෙම බස් රථයට ගොඩ නොවන්න.", "transport"),
    ("அடுத்த நிறுத்தத்தில் இறங்குங்கள்.", "Get off at the next stop.", "ඊළඟ නැවතුමෙන් බසින්න.", "transport"),
    ("இந்த வழித்தடம் இன்று இயங்காது.", "This route is not operating today.", "මෙම මාර්ගය අද ක්‍රියාත්මක නොවේ.", "transport"),
    ("தயவுசெய்து இந்தப் படிவத்தை நிரப்புங்கள்.", "Please fill in this form.", "කරුණාකර මෙම පෝරමය සම්පූර්ණ කරන්න.", "bank"),
    ("உங்கள் வங்கிக் கணக்கு எண்ணைக் குறிப்பிடுங்கள்.", "Provide your bank account number.", "ඔබගේ බැංකු ගිණුම් අංකය සඳහන් කරන්න.", "bank"),
    ("பணத்தை இந்தக் கவுண்டரில் செலுத்துங்கள்.", "Pay the money at this counter.", "මුදල් මෙම කවුන්ටරයට ගෙවන්න.", "bank"),
    ("உங்கள் கையொப்பத்தை இங்கே இடுங்கள்.", "Sign here.", "ඔබගේ අත්සන මෙහි තබන්න.", "bank"),
    ("ரசீதை பாதுகாப்பாக வைத்துக்கொள்ளுங்கள்.", "Keep the receipt safely.", "රිසිට්පත ආරක්ෂිතව තබා ගන්න.", "bank"),
    ("நாளை காலை மீண்டும் வரவும்.", "Please return tomorrow morning.", "හෙට උදෑසන නැවත පැමිණෙන්න.", "hospital"),
    ("மருத்துவமனை நுழைவாயில் இடப்புறத்தில் உள்ளது.", "The hospital entrance is on the left.", "රෝහල් පිවිසුම වම් පසින් පිහිටා ඇත.", "hospital"),
    ("நிலையத்திற்குச் செல்லும் வழி எது?", "Which way is the route to the station?", "නැවතුම්පොළට යන මාර්ගය කුමක්ද?", "transport"),
    ("பயணச்சீட்டை இழந்தால் அலுவலகத்தில் தெரிவிக்கவும்.", "Report a lost ticket at the office.", "ප්‍රවේශපත්‍රය නැති වුවහොත් කාර්යාලයට දැනුම් දෙන්න.", "transport"),
    ("பணம் எடுக்க உங்கள் அட்டையைச் செருகுங்கள்.", "Insert your card to withdraw money.", "මුදල් ආපසු ගැනීමට ඔබගේ කාඩ්පත ඇතුළු කරන්න.", "bank"),
]


def seed_demo_data(db, count=20):
    if count < 20:
        raise ValueError("Demo seed count must be at least 20.")
    if db.get(Setting, "demo_seed_v1"):
        raise ValueError("Demo data is already seeded in this database.")

    admin = db.scalar(select(User).where(User.role == "admin", User.active.is_(True)))
    created_admin_password = None
    if admin is None:
        created_admin_password = secrets.token_urlsafe(24)
        admin = User(
            code="DEMOADMIN",
            password=passwords.hash(created_admin_password),
            role="admin",
            active=True,
        )
        if db.scalar(select(User).where(User.code == "DEMOADMIN")):
            raise ValueError("DEMOADMIN already exists but is not an active administrator.")
        db.add(admin)
        db.flush()

    demo_password = secrets.token_urlsafe(24)
    demo_password_hash = passwords.hash(demo_password)
    teachers = []
    for index in range(1, count + 1):
        code = f"DEMO{index:03d}"
        if db.scalar(select(User).where(User.code == code)):
            raise ValueError(f"Contributor code {code} already exists; no demo rows were added.")
        teacher = User(
            code=code,
            password=demo_password_hash,
            role="teacher",
            active=True,
        )
        db.add(teacher)
        teachers.append(teacher)
    db.flush()

    expired_at = int(time.time()) - 1
    for teacher in teachers:
        db.add(
            Consent(
                user_id=teacher.id,
                recording=True,
                research=False,
                avatar=False,
                public=False,
                withdrawn=False,
            )
        )
        db.add(
            Login(
                token=hashlib.sha256(secrets.token_bytes(32)).hexdigest(),
                user_id=teacher.id,
                csrf=secrets.token_urlsafe(24),
                expires=expired_at,
            )
        )
    db.flush()

    versions = []
    for index in range(1, count + 1):
        tamil, english, sinhala, domain = DEMO_PROMPTS[(index - 1) % len(DEMO_PROMPTS)]
        prompt = Prompt(code=f"DEMO-P{index:03d}")
        db.add(prompt)
        db.flush()
        version = Version(
            prompt_id=prompt.id,
            version=1,
            tamil=tamil,
            english=english,
            sinhala=sinhala,
            domain=domain,
            semantics=json.dumps(
                {"intent": "synthetic demo", "action": "example", "object": "sample prompt"},
                ensure_ascii=False,
            ),
            status="draft",
            exception_note="Synthetic example only; not validated for research use.",
        )
        db.add(version)
        versions.append(version)
    db.flush()

    for index, (teacher, version) in enumerate(zip(teachers, versions), start=1):
        batch = Batch(name=f"Demo collection {index:03d}", pilot=True)
        db.add(batch)
        db.flush()
        db.add(BatchPrompt(batch_id=batch.id, version_id=version.id))
        db.add(Assignment(batch_id=batch.id, user_id=teacher.id))
        consent = db.scalar(select(Consent).where(Consent.user_id == teacher.id))
        session = RecordingSession(
            user_id=teacher.id,
            batch_id=batch.id,
            consent_id=consent.id,
            completed=False,
        )
        db.add(session)
        db.flush()

        take = Take(
            session_id=session.id,
            version_id=version.id,
            key=f"demo-submission-{index:03d}",
            state="pending",
            properties=json.dumps({"demo": True, "media_present": False}),
            storage="local",
            file_ref="",
            selected=False,
        )
        db.add(take)
        db.flush()

        annotation_data = {
            "translates": False,
            "complete": False,
            "variety": "Not provided - synthetic demo",
            "variant": "",
            "hands_visible": False,
            "face_visible": False,
            "framing_issues": "Synthetic sample; no video is associated.",
            "nonmanual_features": "",
            "meaning_notes": "Demo placeholder only. Not a real annotation.",
            "segments": [],
            "status": "needs_review",
        }
        db.add(Annotation(take_id=take.id, reviewer_id=teacher.id, data=json.dumps(annotation_data)))
        db.add(Review(take_id=take.id, reviewer_id=teacher.id, role="teacher", status="needs_review"))
        db.add(Review(take_id=take.id, reviewer_id=admin.id, role="admin", status="needs_review"))
        db.add(Audit(actor=admin.id, action="demo_record_created", target=take.id))

    for index in range(1, count + 1):
        db.add(
            Setting(
                key=f"demo_sample_{index:03d}",
                value=json.dumps({"synthetic": True, "sample": index}),
            )
        )
    db.add(Setting(key="demo_seed_v1", value=json.dumps({"count": count, "synthetic": True})))
    return {
        "count": count,
        "teacher_password": demo_password,
        "admin_code": admin.code if created_admin_password else None,
        "admin_password": created_admin_password,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["migrate", "create-admin", "seed-demo", "recover-uploads"])
    parser.add_argument("--code", default="ADMIN")
    parser.add_argument("--count", type=int, default=20, help="Number of linked synthetic sample records (minimum 20).")
    args = parser.parse_args()
    migrate()
    credentials = None
    with Session.begin() as db:
        if args.command == "create-admin":
            password = getpass.getpass("New admin password (12+ characters): ")
            if len(password) < 12:
                raise SystemExit("Use at least 12 characters.")
            db.add(User(code=args.code, password=passwords.hash(password), role="admin"))
        elif args.command == "seed-demo":
            credentials = seed_demo_data(db, args.count)
        elif args.command == "recover-uploads":
            # Run ONLY with server stopped: interrupted uploads return to pending.
            for take in db.scalars(select(Take).where(Take.state == "uploading")):
                take.state = "pending"
            for path in (ROOT / "temporary").iterdir():
                path.unlink()

    print("Completed:", args.command)
    if credentials:
        print(f"Created {credentials['count']} synthetic demo records in each applicable data table.")
        print("Shared demo teacher password:", credentials["teacher_password"])
        print("Demo teacher codes: DEMO001 through DEMO%03d" % credentials["count"])
        if credentials["admin_code"]:
            print("Created demo administrator:", credentials["admin_code"])
            print("Demo administrator password:", credentials["admin_password"])
        print("Demo consents prohibit research export. Takes are pending and contain no video files.")


if __name__ == "__main__":
    main()
