import os
import json
import hashlib
import smtplib
import imaplib
import email
import threading
import hmac
import time
import csv
import io
import secrets

try:
    import dns.resolver as _dns_resolver
except ImportError:
    _dns_resolver = None
from datetime import datetime, timedelta
from functools import wraps
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify, session, send_from_directory, render_template_string
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import requests as http_requests

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'sendio-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///sendio.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True

CORS(app, supports_credentials=True, origins=['http://localhost:5173', 'http://localhost:5174'])

db = SQLAlchemy(app)


# ─────────────────────────── MODELS ───────────────────────────

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(64), nullable=False)
    role = db.Column(db.String(20), default='user')
    active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    google_email = db.Column(db.String(200))
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    verification_token = db.Column(db.String(100))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'active': self.active,
            'email_verified': self.email_verified,
            'google_email': self.google_email,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class EmailAccount(db.Model):
    __tablename__ = 'email_accounts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200))
    email = db.Column(db.String(200), nullable=False)
    provider = db.Column(db.String(50), default='smtp')
    smtp_host = db.Column(db.String(200))
    smtp_port = db.Column(db.Integer, default=587)
    smtp_user = db.Column(db.String(200))
    smtp_pass = db.Column(db.String(500))
    imap_host = db.Column(db.String(200))
    imap_port = db.Column(db.Integer, default=993)
    imap_user = db.Column(db.String(200))
    imap_pass = db.Column(db.String(500))
    esp_type = db.Column(db.String(50), default='other')
    gap_minutes = db.Column(db.Integer, default=3)
    verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'email': self.email,
            'provider': self.provider,
            'smtp_host': self.smtp_host,
            'smtp_port': self.smtp_port,
            'smtp_user': self.smtp_user,
            'imap_host': self.imap_host,
            'imap_port': self.imap_port,
            'imap_user': self.imap_user,
            'esp_type': self.esp_type,
            'gap_minutes': self.gap_minutes,
            'verified': self.verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Campaign(db.Model):
    __tablename__ = 'campaigns'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), default='draft')
    data_json = db.Column(db.Text, default='[]')
    cols_json = db.Column(db.Text, default='[]')
    email_col = db.Column(db.String(100))
    esp_map_json = db.Column(db.Text, default='{}')
    senders_json = db.Column(db.Text, default='[]')
    total_rows = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'status': self.status,
            'cols': json.loads(self.cols_json or '[]'),
            'email_col': self.email_col,
            'esp_map': json.loads(self.esp_map_json or '{}'),
            'senders': json.loads(self.senders_json or '[]'),
            'total_rows': self.total_rows,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class SequenceStep(db.Model):
    __tablename__ = 'sequence_steps'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    step_order = db.Column(db.Integer, default=1)
    subject = db.Column(db.String(500))
    body_html = db.Column(db.Text)
    wait_days = db.Column(db.Integer, default=3)
    variants_json = db.Column(db.Text)  # JSON array of {label,subject,body,enabled}

    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'step_order': self.step_order,
            'subject': self.subject,
            'body_html': self.body_html,
            'wait_days': self.wait_days,
            'variants': json.loads(self.variants_json) if self.variants_json else None,
        }


class EmailRow(db.Model):
    __tablename__ = 'email_rows'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), default='pending')
    current_step = db.Column(db.Integer, default=0)
    sent = db.Column(db.Integer, default=0)
    bounced = db.Column(db.Boolean, default=False)
    replied = db.Column(db.Boolean, default=False)
    positive_reply = db.Column(db.Boolean, default=False)
    row_data_json = db.Column(db.Text, default='{}')
    last_sent_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'email': self.email,
            'status': self.status,
            'current_step': self.current_step,
            'sent': self.sent,
            'bounced': self.bounced,
            'replied': self.replied,
            'positive_reply': self.positive_reply,
            'row_data': json.loads(self.row_data_json or '{}'),
            'last_sent_at': self.last_sent_at.isoformat() if self.last_sent_at else None,
        }


class InboxMsg(db.Model):
    __tablename__ = 'inbox_msgs'
    id = db.Column(db.Integer, primary_key=True)
    account_email = db.Column(db.String(200))
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=True)
    from_email = db.Column(db.String(200))
    subject = db.Column(db.String(500))
    body = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    replied = db.Column(db.Boolean, default=False)
    category = db.Column(db.String(50), default='uncategorized')
    received_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'account_email': self.account_email,
            'campaign_id': self.campaign_id,
            'from_email': self.from_email,
            'subject': self.subject,
            'body': self.body,
            'is_read': self.is_read,
            'replied': self.replied,
            'category': self.category,
            'received_at': self.received_at.isoformat() if self.received_at else None,
        }


class Subsequence(db.Model):
    __tablename__ = 'subsequences'
    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    trigger = db.Column(db.String(50))
    wait_days = db.Column(db.Integer, default=1)
    subject = db.Column(db.String(500))
    body_html = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'campaign_id': self.campaign_id,
            'trigger': self.trigger,
            'wait_days': self.wait_days,
            'subject': self.subject,
            'body_html': self.body_html,
        }


class Unsubscribe(db.Model):
    __tablename__ = 'unsubscribes'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(200), nullable=False)
    campaign_id = db.Column(db.Integer, nullable=True)
    reason = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'campaign_id': self.campaign_id,
            'reason': self.reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class WarmupAccount(db.Model):
    __tablename__ = 'warmup_accounts'
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, db.ForeignKey('email_accounts.id'), nullable=False)
    status = db.Column(db.String(50), default='paused')
    daily_target = db.Column(db.Integer, default=40)
    daily_current = db.Column(db.Integer, default=0)
    ramp_days = db.Column(db.Integer, default=30)
    score = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        account = EmailAccount.query.get(self.account_id)
        return {
            'id': self.id,
            'account_id': self.account_id,
            'account_email': account.email if account else None,
            'account_name': account.name if account else None,
            'status': self.status,
            'daily_target': self.daily_target,
            'daily_current': self.daily_current,
            'ramp_days': self.ramp_days,
            'score': self.score,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class WarmupLog(db.Model):
    __tablename__ = 'warmup_logs'
    id = db.Column(db.Integer, primary_key=True)
    warmup_id = db.Column(db.Integer, db.ForeignKey('warmup_accounts.id'), nullable=False)
    date = db.Column(db.String(20))
    sent = db.Column(db.Integer, default=0)
    received = db.Column(db.Integer, default=0)
    replied = db.Column(db.Integer, default=0)
    score_delta = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'warmup_id': self.warmup_id,
            'date': self.date,
            'sent': self.sent,
            'received': self.received,
            'replied': self.replied,
            'score_delta': self.score_delta,
        }


class Webhook(db.Model):
    __tablename__ = 'webhooks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200))
    url = db.Column(db.String(500))
    secret = db.Column(db.String(200))
    events_json = db.Column(db.Text, default='[]')
    active = db.Column(db.Boolean, default=True)
    fire_count = db.Column(db.Integer, default=0)
    fail_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'url': self.url,
            'secret': self.secret,
            'events': json.loads(self.events_json or '[]'),
            'active': self.active,
            'fire_count': self.fire_count,
            'fail_count': self.fail_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class WebhookLog(db.Model):
    __tablename__ = 'webhook_logs'
    id = db.Column(db.Integer, primary_key=True)
    webhook_id = db.Column(db.Integer, db.ForeignKey('webhooks.id'), nullable=False)
    event = db.Column(db.String(100))
    payload = db.Column(db.Text)
    status_code = db.Column(db.Integer)
    success = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'webhook_id': self.webhook_id,
            'event': self.event,
            'payload': self.payload,
            'status_code': self.status_code,
            'success': self.success,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class CRMContact(db.Model):
    __tablename__ = 'crm_contacts'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    company = db.Column(db.String(200))
    title = db.Column(db.String(200))
    stage = db.Column(db.String(50), default='lead')
    tags_json = db.Column(db.Text, default='[]')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'company': self.company,
            'title': self.title,
            'stage': self.stage,
            'tags': json.loads(self.tags_json or '[]'),
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class CRMActivity(db.Model):
    __tablename__ = 'crm_activities'
    id = db.Column(db.Integer, primary_key=True)
    contact_id = db.Column(db.Integer, db.ForeignKey('crm_contacts.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity = db.Column(db.String(100))
    detail = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'contact_id': self.contact_id,
            'user_id': self.user_id,
            'activity': self.activity,
            'detail': self.detail,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ─────────────────────────── HELPERS ───────────────────────────

def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        user = User.query.get(session['user_id'])
        if not user or user.role != 'admin':
            return jsonify({'error': 'Admin required'}), 403
        return f(*args, **kwargs)
    return decorated


def get_current_user():
    if 'user_id' in session:
        return User.query.get(session['user_id'])
    return None


def fire_webhook(event, payload_dict, user_id=None):
    def _fire():
        with app.app_context():
            query = Webhook.query.filter_by(active=True)
            if user_id:
                query = query.filter_by(user_id=user_id)
            hooks = query.all()
            for hook in hooks:
                events = json.loads(hook.events_json or '[]')
                if event not in events:
                    continue
                payload_str = json.dumps(payload_dict)
                sig = ''
                if hook.secret:
                    sig = hmac.new(hook.secret.encode(), payload_str.encode(), hashlib.sha256).hexdigest()  # noqa
                headers = {
                    'Content-Type': 'application/json',
                    'X-Sendio-Event': event,
                    'X-Sendio-Signature': sig,
                }
                success = False
                status_code = 0
                try:
                    resp = http_requests.post(hook.url, data=payload_str, headers=headers, timeout=10)
                    status_code = resp.status_code
                    success = resp.status_code < 400
                except Exception:
                    pass
                log = WebhookLog(
                    webhook_id=hook.id,
                    event=event,
                    payload=payload_str,
                    status_code=status_code,
                    success=success,
                )
                db.session.add(log)
                if success:
                    hook.fire_count += 1
                else:
                    hook.fail_count += 1
                db.session.commit()
    threading.Thread(target=_fire, daemon=True).start()


def detect_esp(email_addr):
    domain = email_addr.split('@')[-1]
    try:
        if _dns_resolver:
            answers = _dns_resolver.resolve(domain, 'MX')
            mx = str(answers[0].exchange).lower()
            if 'google' in mx or 'gmail' in mx or 'googlemail' in mx:
                return 'google'
            if 'outlook' in mx or 'microsoft' in mx or 'hotmail' in mx:
                return 'microsoft'
            if 'amazonses' in mx:
                return 'ses'
            if 'sendgrid' in mx:
                return 'sendgrid'
            if 'mailgun' in mx:
                return 'mailgun'
    except Exception:
        pass
    return 'other'


# ─────────────────────────── AUTH ROUTES ───────────────────────────

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    user = User.query.filter_by(username=username).first()
    if not user or user.password != hash_pw(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    if not user.active:
        return jsonify({'error': 'Account disabled'}), 403
    if not user.email_verified:
        return jsonify({'error': 'Please verify your email before logging in', 'needs_verification': True}), 403
    session['user_id'] = user.id
    session['role'] = user.role
    user.last_login = datetime.utcnow()
    db.session.commit()
    return jsonify({'user': user.to_dict()})


@app.route('/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'ok': True})


@app.route('/auth/me', methods=['GET'])
def me():
    user = get_current_user()
    if not user:
        return jsonify({'user': None})
    return jsonify({'user': user.to_dict()})


@app.route('/auth/signup', methods=['POST'])
def signup():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    google_email = data.get('email', '').strip()
    full_name = data.get('name', '').strip()
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    if not google_email:
        return jsonify({'error': 'Email address required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400
    if User.query.filter_by(google_email=google_email).first():
        return jsonify({'error': 'Email already registered'}), 400
    token = secrets.token_urlsafe(32)
    user = User(
        username=username,
        password=hash_pw(password),
        role='user',
        google_email=google_email,
        email_verified=False,
        verification_token=token,
    )
    db.session.add(user)
    db.session.commit()
    # In production you'd send a real email here.
    # For demo we return the token so the frontend can show the verify link.
    verify_url = f'http://localhost:5000/auth/verify/{token}'
    return jsonify({
        'needs_verification': True,
        'message': f'Account created! Check {google_email} for a verification link.',
        'demo_verify_url': verify_url,
        'email': google_email,
    })


@app.route('/auth/verify/<token>', methods=['GET'])
def verify_email(token):
    from flask import redirect
    user = User.query.filter_by(verification_token=token).first()
    if not user:
        return render_template_string(
            '<html><body style="font-family:sans-serif;display:flex;align-items:center;'
            'justify-content:center;height:100vh;background:#f5f5f9">'
            '<div style="text-align:center"><h2 style="color:#ef4444">Invalid or expired link</h2>'
            '<a href="http://localhost:5173/login" style="color:#6366f1">Back to login</a></div></body></html>'
        ), 400
    user.email_verified = True
    user.verification_token = None
    db.session.commit()
    return redirect('http://localhost:5173/login?verified=1')


# ─────────────────────────── CAMPAIGN ROUTES ───────────────────────────

@app.route('/get-campaigns', methods=['GET', 'POST'])
@login_required
def campaigns():
    user = get_current_user()
    if request.method == 'GET':
        if user.role == 'admin':
            camps = Campaign.query.order_by(Campaign.created_at.desc()).all()
        else:
            camps = Campaign.query.filter_by(user_id=user.id).order_by(Campaign.created_at.desc()).all()
        result = []
        for c in camps:
            d = c.to_dict()
            steps = SequenceStep.query.filter_by(campaign_id=c.id).count()
            d['step_count'] = steps
            rows = EmailRow.query.filter_by(campaign_id=c.id)
            d['stats'] = {
                'total': rows.count(),
                'sent': rows.filter(EmailRow.sent > 0).count(),
                'replied': rows.filter_by(replied=True).count(),
                'bounced': rows.filter_by(bounced=True).count(),
            }
            result.append(d)
        return jsonify(result)
    # POST = create
    data = request.json or {}
    camp = Campaign(
        user_id=user.id,
        name=data.get('name', 'New Campaign'),
        status='draft',
    )
    db.session.add(camp)
    db.session.commit()
    return jsonify(camp.to_dict())


@app.route('/upload', methods=['POST'])
@login_required
def upload_csv():
    user = get_current_user()
    campaign_id = request.form.get('campaign_id')
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    f = request.files['file']
    content = f.read().decode('utf-8', errors='replace')
    reader = csv.DictReader(io.StringIO(content))
    rows = list(reader)
    if not rows:
        return jsonify({'error': 'Empty CSV'}), 400
    cols = list(rows[0].keys())

    if campaign_id:
        camp = Campaign.query.get(campaign_id)
        if not camp:
            return jsonify({'error': 'Campaign not found'}), 404
    else:
        camp = Campaign(user_id=user.id, name=f.filename.replace('.csv', ''), status='draft')
        db.session.add(camp)
        db.session.flush()

    camp.cols_json = json.dumps(cols)
    camp.data_json = json.dumps(rows[:5000])
    camp.total_rows = len(rows)
    db.session.commit()
    return jsonify({'campaign_id': camp.id, 'cols': cols, 'total_rows': len(rows), 'preview': rows[:5]})


@app.route('/load-campaign/<int:cid>', methods=['GET'])
@login_required
def load_campaign(cid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    d = camp.to_dict()
    d['data'] = json.loads(camp.data_json or '[]')
    d['steps'] = [s.to_dict() for s in SequenceStep.query.filter_by(campaign_id=cid).order_by(SequenceStep.step_order).all()]
    return jsonify(d)


@app.route('/update-campaign/<int:cid>', methods=['PUT'])
@login_required
def update_campaign(cid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    data = request.json or {}
    for field in ['name', 'email_col', 'status']:
        if field in data:
            setattr(camp, field, data[field])
    if 'esp_map' in data:
        camp.esp_map_json = json.dumps(data['esp_map'])
    if 'senders' in data:
        camp.senders_json = json.dumps(data['senders'])
    camp.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(camp.to_dict())


@app.route('/delete-campaign/<int:cid>', methods=['DELETE'])
@login_required
def delete_campaign(cid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    EmailRow.query.filter_by(campaign_id=cid).delete()
    SequenceStep.query.filter_by(campaign_id=cid).delete()
    Subsequence.query.filter_by(campaign_id=cid).delete()
    db.session.delete(camp)
    db.session.commit()
    return jsonify({'ok': True})


@app.route('/campaign/<int:cid>/start', methods=['POST'])
@login_required
def start_campaign(cid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    camp.status = 'active'
    # Load rows from data_json into EmailRow if not done yet
    existing = EmailRow.query.filter_by(campaign_id=cid).count()
    if existing == 0 and camp.email_col:
        data = json.loads(camp.data_json or '[]')
        for row in data:
            em = row.get(camp.email_col, '')
            if em:
                er = EmailRow(campaign_id=cid, email=em, row_data_json=json.dumps(row))
                db.session.add(er)
    db.session.commit()
    fire_webhook('campaign.started', {'campaign_id': cid, 'name': camp.name}, user.id)
    return jsonify({'ok': True, 'status': 'active'})


@app.route('/campaign/<int:cid>/pause', methods=['POST'])
@login_required
def pause_campaign(cid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    camp.status = 'paused'
    db.session.commit()
    return jsonify({'ok': True, 'status': 'paused'})


@app.route('/campaign/<int:cid>/leads/search', methods=['GET'])
@login_required
def search_leads(cid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    q = request.args.get('q', '')
    status = request.args.get('status', '')
    query = EmailRow.query.filter_by(campaign_id=cid)
    if q:
        query = query.filter(EmailRow.email.contains(q))
    if status:
        query = query.filter_by(status=status)
    rows = query.limit(100).all()
    return jsonify([r.to_dict() for r in rows])


# ─────────────────────────── SEQUENCE ROUTES ───────────────────────────

@app.route('/campaign/<int:cid>/steps', methods=['GET', 'POST'])
@login_required
def steps(cid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    if request.method == 'GET':
        ss = SequenceStep.query.filter_by(campaign_id=cid).order_by(SequenceStep.step_order).all()
        return jsonify([s.to_dict() for s in ss])
    data = request.json or {}
    step = SequenceStep(
        campaign_id=cid,
        step_order=data.get('step_order', 1),
        subject=data.get('subject', ''),
        body_html=data.get('body_html', ''),
        wait_days=data.get('wait_days', 3),
        variants_json=json.dumps(data['variants']) if 'variants' in data else None,
    )
    db.session.add(step)
    db.session.commit()
    return jsonify(step.to_dict())


@app.route('/campaign/<int:cid>/steps/<int:sid>', methods=['PUT', 'DELETE'])
@login_required
def step_detail(cid, sid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    step = SequenceStep.query.get_or_404(sid)
    if request.method == 'DELETE':
        db.session.delete(step)
        db.session.commit()
        return jsonify({'ok': True})
    data = request.json or {}
    for field in ['subject', 'body_html', 'wait_days', 'step_order']:
        if field in data:
            setattr(step, field, data[field])
    db.session.commit()
    return jsonify(step.to_dict())


# ─────────────────────────── SUBSEQUENCE ROUTES ───────────────────────────

@app.route('/campaign/<int:cid>/subsequences', methods=['GET', 'POST'])
@login_required
def subsequences(cid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    if request.method == 'GET':
        ss = Subsequence.query.filter_by(campaign_id=cid).all()
        return jsonify([s.to_dict() for s in ss])
    data = request.json or {}
    sub = Subsequence(
        campaign_id=cid,
        trigger=data.get('trigger', 'replied'),
        wait_days=data.get('wait_days', 1),
        subject=data.get('subject', ''),
        body_html=data.get('body_html', ''),
    )
    db.session.add(sub)
    db.session.commit()
    return jsonify(sub.to_dict())


@app.route('/campaign/<int:cid>/subsequences/<int:sid>', methods=['PUT', 'DELETE'])
@login_required
def subsequence_detail(cid, sid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    sub = Subsequence.query.get_or_404(sid)
    if request.method == 'DELETE':
        db.session.delete(sub)
        db.session.commit()
        return jsonify({'ok': True})
    data = request.json or {}
    for field in ['trigger', 'wait_days', 'subject', 'body_html']:
        if field in data:
            setattr(sub, field, data[field])
    db.session.commit()
    return jsonify(sub.to_dict())


# ─────────────────────────── ACCOUNT ROUTES ───────────────────────────

@app.route('/accounts', methods=['GET', 'POST'])
@login_required
def accounts():
    user = get_current_user()
    if request.method == 'GET':
        if user.role == 'admin':
            accs = EmailAccount.query.all()
        else:
            accs = EmailAccount.query.filter_by(user_id=user.id).all()
        return jsonify([a.to_dict() for a in accs])
    data = request.json or {}
    acc = EmailAccount(
        user_id=user.id,
        name=data.get('name', data.get('email', '')),
        email=data.get('email', ''),
        provider=data.get('provider', 'smtp'),
        smtp_host=data.get('smtp_host', ''),
        smtp_port=data.get('smtp_port', 587),
        smtp_user=data.get('smtp_user', ''),
        smtp_pass=data.get('smtp_pass', ''),
        imap_host=data.get('imap_host', ''),
        imap_port=data.get('imap_port', 993),
        imap_user=data.get('imap_user', ''),
        imap_pass=data.get('imap_pass', ''),
        esp_type=data.get('esp_type', detect_esp(data.get('email', '@'))),
        gap_minutes=data.get('gap_minutes', 3),
    )
    db.session.add(acc)
    db.session.commit()
    return jsonify(acc.to_dict())


@app.route('/accounts/<int:aid>', methods=['PUT', 'DELETE'])
@login_required
def account_detail(aid):
    user = get_current_user()
    acc = EmailAccount.query.get_or_404(aid)
    if user.role != 'admin' and acc.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    if request.method == 'DELETE':
        db.session.delete(acc)
        db.session.commit()
        return jsonify({'ok': True})
    data = request.json or {}
    for field in ['name', 'email', 'provider', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass',
                  'imap_host', 'imap_port', 'imap_user', 'imap_pass', 'esp_type', 'gap_minutes']:
        if field in data:
            setattr(acc, field, data[field])
    db.session.commit()
    return jsonify(acc.to_dict())


@app.route('/verify-account/<int:aid>', methods=['POST'])
@login_required
def verify_account(aid):
    user = get_current_user()
    acc = EmailAccount.query.get_or_404(aid)
    if user.role != 'admin' and acc.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    try:
        server = smtplib.SMTP(acc.smtp_host, acc.smtp_port, timeout=10)
        server.ehlo()
        if acc.smtp_port == 587:
            server.starttls()
        server.login(acc.smtp_user, acc.smtp_pass)
        server.quit()
        acc.verified = True
        db.session.commit()
        return jsonify({'ok': True, 'verified': True})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 400


# ─────────────────────────── INBOX ROUTES ───────────────────────────

@app.route('/inbox', methods=['GET'])
@login_required
def inbox():
    user = get_current_user()
    campaign_id = request.args.get('campaign_id')
    unread_only = request.args.get('unread') == '1'
    category = request.args.get('category')

    if user.role == 'admin':
        accs = EmailAccount.query.all()
    else:
        accs = EmailAccount.query.filter_by(user_id=user.id).all()

    account_emails = [a.email for a in accs]
    query = InboxMsg.query.filter(InboxMsg.account_email.in_(account_emails))

    if campaign_id:
        query = query.filter_by(campaign_id=int(campaign_id))
    if unread_only:
        query = query.filter_by(is_read=False)
    if category:
        query = query.filter_by(category=category)

    msgs = query.order_by(InboxMsg.received_at.desc()).limit(200).all()
    unread_count = InboxMsg.query.filter(
        InboxMsg.account_email.in_(account_emails),
        InboxMsg.is_read == False
    ).count()
    return jsonify({'messages': [m.to_dict() for m in msgs], 'unread': unread_count})


@app.route('/inbox/<int:mid>/reply', methods=['POST'])
@login_required
def inbox_reply(mid):
    msg = InboxMsg.query.get_or_404(mid)
    data = request.json or {}
    body = data.get('body', '')
    user = get_current_user()
    accs = EmailAccount.query.filter_by(email=msg.account_email).first()
    if not accs:
        return jsonify({'error': 'Account not found'}), 404

    def send():
        try:
            smtp = smtplib.SMTP(accs.smtp_host, accs.smtp_port, timeout=15)
            smtp.ehlo()
            if accs.smtp_port == 587:
                smtp.starttls()
            smtp.login(accs.smtp_user, accs.smtp_pass)
            m = MIMEMultipart('alternative')
            m['Subject'] = 'Re: ' + (msg.subject or '')
            m['From'] = accs.email
            m['To'] = msg.from_email
            m.attach(MIMEText(body, 'html'))
            smtp.sendmail(accs.email, [msg.from_email], m.as_string())
            smtp.quit()
            with app.app_context():
                msg2 = InboxMsg.query.get(mid)
                if msg2:
                    msg2.replied = True
                    db.session.commit()
        except Exception as e:
            print('Reply error:', e)
    threading.Thread(target=send, daemon=True).start()
    return jsonify({'ok': True})


@app.route('/inbox/<int:mid>/mark-read', methods=['POST'])
@login_required
def mark_read(mid):
    msg = InboxMsg.query.get_or_404(mid)
    msg.is_read = True
    db.session.commit()
    return jsonify({'ok': True})


@app.route('/inbox/<int:mid>/categorize', methods=['POST'])
@login_required
def categorize(mid):
    msg = InboxMsg.query.get_or_404(mid)
    data = request.json or {}
    msg.category = data.get('category', 'uncategorized')
    db.session.commit()
    return jsonify({'ok': True})


# ─────────────────────────── ANALYTICS ROUTES ───────────────────────────

@app.route('/analytics/global', methods=['GET'])
@login_required
def global_analytics():
    user = get_current_user()
    if user.role == 'admin':
        camps = Campaign.query.all()
    else:
        camps = Campaign.query.filter_by(user_id=user.id).all()
    camp_ids = [c.id for c in camps]

    rows = EmailRow.query.filter(EmailRow.campaign_id.in_(camp_ids)) if camp_ids else []

    total_sent = sum(r.sent for r in rows) if camp_ids else 0
    total_replied = sum(1 for r in rows if r.replied) if camp_ids else 0
    total_bounced = sum(1 for r in rows if r.bounced) if camp_ids else 0
    total_positive = sum(1 for r in rows if r.positive_reply) if camp_ids else 0
    total_unsub = Unsubscribe.query.filter(Unsubscribe.campaign_id.in_(camp_ids)).count() if camp_ids else 0
    active_camps = sum(1 for c in camps if c.status == 'active')

    # Daily stats (last 30 days)
    daily = []
    for i in range(29, -1, -1):
        d = (datetime.utcnow() - timedelta(days=i)).strftime('%Y-%m-%d')
        daily.append({
            'date': d,
            'sent': (i % 7) * 12 + 5,  # simulated for demo
            'replies': (i % 7) * 2 + 1,
            'opens': (i % 7) * 8 + 3,
        })

    # ESP breakdown (simulated)
    esp_data = [
        {'name': 'Google', 'value': 45},
        {'name': 'Microsoft', 'value': 30},
        {'name': 'Other', 'value': 25},
    ]

    # Top campaigns
    top_camps = []
    for c in camps[:5]:
        c_rows = EmailRow.query.filter_by(campaign_id=c.id).all()
        sent = sum(r.sent for r in c_rows)
        replied = sum(1 for r in c_rows if r.replied)
        top_camps.append({
            'id': c.id,
            'name': c.name,
            'sent': sent,
            'replied': replied,
            'reply_rate': round(replied / max(sent, 1) * 100, 1),
            'status': c.status,
        })

    return jsonify({
        'stats': {
            'sent': total_sent,
            'opens': int(total_sent * 0.42),
            'clicks': int(total_sent * 0.08),
            'replies': total_replied,
            'bounce_rate': round(total_bounced / max(total_sent, 1) * 100, 1),
            'positive_replies': total_positive,
            'unsubscribes': total_unsub,
            'active_campaigns': active_camps,
        },
        'daily': daily,
        'esp': esp_data,
        'top_campaigns': top_camps,
    })


@app.route('/campaign/<int:cid>/analytics', methods=['GET'])
@login_required
def campaign_analytics(cid):
    user = get_current_user()
    camp = Campaign.query.get_or_404(cid)
    if user.role != 'admin' and camp.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    rows = EmailRow.query.filter_by(campaign_id=cid).all()
    return jsonify({
        'total': len(rows),
        'sent': sum(r.sent for r in rows),
        'replied': sum(1 for r in rows if r.replied),
        'bounced': sum(1 for r in rows if r.bounced),
        'positive': sum(1 for r in rows if r.positive_reply),
    })


# ─────────────────────────── ESP LOOKUP ───────────────────────────

@app.route('/esp-lookup', methods=['GET'])
def esp_lookup():
    email_addr = request.args.get('email', '')
    if not email_addr or '@' not in email_addr:
        return jsonify({'error': 'Invalid email'}), 400
    esp = detect_esp(email_addr)
    return jsonify({'email': email_addr, 'esp': esp})


# ─────────────────────────── WARMUP ROUTES ───────────────────────────

@app.route('/warmup', methods=['GET', 'POST'])
@login_required
def warmup():
    user = get_current_user()
    if request.method == 'GET':
        if user.role == 'admin':
            accs = EmailAccount.query.all()
        else:
            accs = EmailAccount.query.filter_by(user_id=user.id).all()
        acc_ids = [a.id for a in accs]
        warms = WarmupAccount.query.filter(WarmupAccount.account_id.in_(acc_ids)).all() if acc_ids else []
        result = []
        for w in warms:
            d = w.to_dict()
            logs = WarmupLog.query.filter_by(warmup_id=w.id).order_by(WarmupLog.date.desc()).limit(30).all()
            d['logs'] = [l.to_dict() for l in reversed(logs)]
            result.append(d)
        return jsonify(result)
    data = request.json or {}
    acc_id = data.get('account_id')
    if not acc_id:
        return jsonify({'error': 'account_id required'}), 400
    existing = WarmupAccount.query.filter_by(account_id=acc_id).first()
    if existing:
        return jsonify({'error': 'Already added'}), 400
    w = WarmupAccount(
        account_id=acc_id,
        daily_target=data.get('daily_target', 40),
        ramp_days=data.get('ramp_days', 30),
        score=50,
    )
    db.session.add(w)
    db.session.commit()
    return jsonify(w.to_dict())


@app.route('/warmup/<int:wid>', methods=['PUT', 'DELETE'])
@login_required
def warmup_detail(wid):
    w = WarmupAccount.query.get_or_404(wid)
    if request.method == 'DELETE':
        WarmupLog.query.filter_by(warmup_id=wid).delete()
        db.session.delete(w)
        db.session.commit()
        return jsonify({'ok': True})
    data = request.json or {}
    for field in ['status', 'daily_target', 'ramp_days']:
        if field in data:
            setattr(w, field, data[field])
    db.session.commit()
    return jsonify(w.to_dict())


@app.route('/warmup/<int:wid>/run', methods=['POST'])
@login_required
def warmup_run(wid):
    w = WarmupAccount.query.get_or_404(wid)
    w.status = 'running'
    # Simulate a warmup cycle
    today = datetime.utcnow().strftime('%Y-%m-%d')
    existing_log = WarmupLog.query.filter_by(warmup_id=wid, date=today).first()
    sent = 5
    received = 4
    replied = 3
    score_delta = 2
    if not existing_log:
        log = WarmupLog(warmup_id=wid, date=today, sent=sent, received=received, replied=replied, score_delta=score_delta)
        db.session.add(log)
    w.daily_current = sent
    w.score = min(100, w.score + score_delta)
    db.session.commit()
    return jsonify({'ok': True, 'score': w.score})


# ─────────────────────────── WEBHOOK ROUTES ───────────────────────────

@app.route('/webhooks', methods=['GET', 'POST'])
@login_required
def webhooks():
    user = get_current_user()
    if request.method == 'GET':
        if user.role == 'admin':
            hooks = Webhook.query.all()
        else:
            hooks = Webhook.query.filter_by(user_id=user.id).all()
        return jsonify([h.to_dict() for h in hooks])
    data = request.json or {}
    hook = Webhook(
        user_id=user.id,
        name=data.get('name', ''),
        url=data.get('url', ''),
        secret=data.get('secret', ''),
        events_json=json.dumps(data.get('events', [])),
        active=data.get('active', True),
    )
    db.session.add(hook)
    db.session.commit()
    return jsonify(hook.to_dict())


@app.route('/webhooks/<int:hid>', methods=['PUT', 'DELETE'])
@login_required
def webhook_detail(hid):
    user = get_current_user()
    hook = Webhook.query.get_or_404(hid)
    if user.role != 'admin' and hook.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    if request.method == 'DELETE':
        WebhookLog.query.filter_by(webhook_id=hid).delete()
        db.session.delete(hook)
        db.session.commit()
        return jsonify({'ok': True})
    data = request.json or {}
    for field in ['name', 'url', 'secret', 'active']:
        if field in data:
            setattr(hook, field, data[field])
    if 'events' in data:
        hook.events_json = json.dumps(data['events'])
    db.session.commit()
    return jsonify(hook.to_dict())


@app.route('/webhooks/<int:hid>/test', methods=['POST'])
@login_required
def webhook_test(hid):
    hook = Webhook.query.get_or_404(hid)
    fire_webhook('test.event', {'message': 'Test from Sendio', 'webhook_id': hid})
    return jsonify({'ok': True})


@app.route('/webhooks/<int:hid>/logs', methods=['GET'])
@login_required
def webhook_logs(hid):
    logs = WebhookLog.query.filter_by(webhook_id=hid).order_by(WebhookLog.created_at.desc()).limit(50).all()
    return jsonify([l.to_dict() for l in logs])


# ─────────────────────────── CRM ROUTES ───────────────────────────

@app.route('/crm/contacts', methods=['GET', 'POST'])
@login_required
def crm_contacts():
    user = get_current_user()
    if request.method == 'GET':
        if user.role == 'admin':
            contacts = CRMContact.query.order_by(CRMContact.created_at.desc()).all()
        else:
            contacts = CRMContact.query.filter_by(user_id=user.id).order_by(CRMContact.created_at.desc()).all()
        return jsonify([c.to_dict() for c in contacts])
    data = request.json or {}
    c = CRMContact(
        user_id=user.id,
        email=data.get('email', ''),
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        company=data.get('company', ''),
        title=data.get('title', ''),
        stage=data.get('stage', 'lead'),
        tags_json=json.dumps(data.get('tags', [])),
        notes=data.get('notes', ''),
    )
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict())


@app.route('/crm/contacts/<int:cid>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def crm_contact_detail(cid):
    user = get_current_user()
    c = CRMContact.query.get_or_404(cid)
    if user.role != 'admin' and c.user_id != user.id:
        return jsonify({'error': 'Forbidden'}), 403
    if request.method == 'GET':
        d = c.to_dict()
        activities = CRMActivity.query.filter_by(contact_id=cid).order_by(CRMActivity.created_at.desc()).all()
        d['activities'] = [a.to_dict() for a in activities]
        return jsonify(d)
    if request.method == 'DELETE':
        CRMActivity.query.filter_by(contact_id=cid).delete()
        db.session.delete(c)
        db.session.commit()
        return jsonify({'ok': True})
    data = request.json or {}
    for field in ['email', 'first_name', 'last_name', 'company', 'title', 'stage', 'notes']:
        if field in data:
            setattr(c, field, data[field])
    if 'tags' in data:
        c.tags_json = json.dumps(data['tags'])
    c.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(c.to_dict())


@app.route('/crm/contacts/<int:cid>/activity', methods=['POST'])
@login_required
def crm_activity(cid):
    user = get_current_user()
    data = request.json or {}
    a = CRMActivity(
        contact_id=cid,
        user_id=user.id,
        activity=data.get('activity', 'note'),
        detail=data.get('detail', ''),
    )
    db.session.add(a)
    db.session.commit()
    return jsonify(a.to_dict())


@app.route('/crm/export', methods=['GET'])
@login_required
def crm_export():
    user = get_current_user()
    if user.role == 'admin':
        contacts = CRMContact.query.all()
    else:
        contacts = CRMContact.query.filter_by(user_id=user.id).all()
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=['id', 'email', 'first_name', 'last_name', 'company', 'title', 'stage', 'notes', 'created_at'])
    writer.writeheader()
    for c in contacts:
        writer.writerow({
            'id': c.id, 'email': c.email, 'first_name': c.first_name,
            'last_name': c.last_name, 'company': c.company, 'title': c.title,
            'stage': c.stage, 'notes': c.notes, 'created_at': c.created_at,
        })
    from flask import Response
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=crm_contacts.csv'},
    )


@app.route('/crm/import', methods=['POST'])
@login_required
def crm_import():
    user = get_current_user()
    campaign_id = request.json.get('campaign_id') if request.json else None
    if not campaign_id:
        return jsonify({'error': 'campaign_id required'}), 400
    camp = Campaign.query.get_or_404(campaign_id)
    rows = json.loads(camp.data_json or '[]')
    imported = 0
    for row in rows:
        em = row.get(camp.email_col or '', '')
        if not em:
            continue
        existing = CRMContact.query.filter_by(user_id=user.id, email=em).first()
        if not existing:
            c = CRMContact(
                user_id=user.id,
                email=em,
                first_name=row.get('first_name', row.get('First Name', '')),
                last_name=row.get('last_name', row.get('Last Name', '')),
                company=row.get('company', row.get('Company', '')),
                title=row.get('title', row.get('Title', '')),
                stage='lead',
            )
            db.session.add(c)
            imported += 1
    db.session.commit()
    return jsonify({'ok': True, 'imported': imported})


# ─────────────────────────── USERS ROUTES (admin) ───────────────────────────

@app.route('/users', methods=['GET'])
@admin_required
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@app.route('/users/create', methods=['POST'])
@admin_required
def create_user():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'user')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400
    u = User(username=username, password=hash_pw(password), role=role, email_verified=True)
    db.session.add(u)
    db.session.commit()
    return jsonify(u.to_dict())


@app.route('/users/<int:uid>/toggle', methods=['POST'])
@admin_required
def toggle_user(uid):
    u = User.query.get_or_404(uid)
    if u.role == 'admin':
        return jsonify({'error': 'Cannot disable admin'}), 400
    u.active = not u.active
    db.session.commit()
    return jsonify(u.to_dict())


@app.route('/users/<int:uid>/reset-password', methods=['POST'])
@admin_required
def reset_password(uid):
    u = User.query.get_or_404(uid)
    data = request.json or {}
    new_pw = data.get('password', '')
    if not new_pw:
        return jsonify({'error': 'Password required'}), 400
    u.password = hash_pw(new_pw)
    db.session.commit()
    return jsonify({'ok': True})


@app.route('/users/<int:uid>/delete', methods=['DELETE'])
@admin_required
def delete_user(uid):
    u = User.query.get_or_404(uid)
    if u.role == 'admin':
        return jsonify({'error': 'Cannot delete admin'}), 400
    db.session.delete(u)
    db.session.commit()
    return jsonify({'ok': True})


# ─────────────────────────── UNSUBSCRIBE ROUTES ───────────────────────────

@app.route('/unsubscribes', methods=['GET'])
@admin_required
def list_unsubscribes():
    q = request.args.get('q', '')
    query = Unsubscribe.query
    if q:
        query = query.filter(Unsubscribe.email.contains(q))
    unsubs = query.order_by(Unsubscribe.created_at.desc()).all()
    return jsonify([u.to_dict() for u in unsubs])


@app.route('/unsubscribe', methods=['GET', 'POST'])
def public_unsubscribe():
    email_addr = request.args.get('email', '')
    campaign_id = request.args.get('cid')
    token = request.args.get('token', '')

    if request.method == 'POST':
        email_addr = request.form.get('email', email_addr)
        if email_addr:
            existing = Unsubscribe.query.filter_by(email=email_addr).first()
            if not existing:
                u = Unsubscribe(email=email_addr, campaign_id=campaign_id, reason='user_request')
                db.session.add(u)
                db.session.commit()
                fire_webhook('lead.unsubscribed', {'email': email_addr, 'campaign_id': campaign_id})
        return render_template_string(UNSUB_SUCCESS_HTML, email=email_addr)

    return render_template_string(UNSUB_HTML, email=email_addr, campaign_id=campaign_id)


UNSUB_HTML = '''<!DOCTYPE html>
<html><head><title>Unsubscribe - Sendio</title>
<style>body{font-family:system-ui,sans-serif;background:#07101e;color:#f0f4ff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#0d1829;border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:48px;max-width:480px;width:100%;text-align:center}
h1{color:#6366f1;margin-bottom:8px}p{color:#8b9ab5;margin-bottom:32px}
input{width:100%;padding:12px;background:#131f35;border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:#f0f4ff;font-size:16px;box-sizing:border-box;margin-bottom:16px}
button{width:100%;padding:12px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer}
button:hover{background:#5254cc}</style></head>
<body><div class="card"><h1>Unsubscribe</h1>
<p>Enter your email address to unsubscribe from all future emails.</p>
<form method="POST"><input type="email" name="email" value="{{ email }}" placeholder="your@email.com" required>
<button type="submit">Unsubscribe Me</button></form></div></body></html>'''

UNSUB_SUCCESS_HTML = '''<!DOCTYPE html>
<html><head><title>Unsubscribed - Sendio</title>
<style>body{font-family:system-ui,sans-serif;background:#07101e;color:#f0f4ff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#0d1829;border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:48px;max-width:480px;width:100%;text-align:center}
h1{color:#22c55e;margin-bottom:8px}p{color:#8b9ab5}</style></head>
<body><div class="card"><h1>✓ Unsubscribed</h1>
<p>{{ email }} has been successfully removed from our mailing list.<br>You will not receive any more emails from us.</p></div></body></html>'''


# ─────────────────────────── STARTUP ───────────────────────────

def create_defaults():
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                password=hash_pw('admin123'),
                role='admin',
                email_verified=True,
                google_email='admin@sendio.io',
            )
            db.session.add(admin)
            db.session.commit()
            print('✓ Default admin created: admin / admin123')

        # Add some demo inbox messages
        if InboxMsg.query.count() == 0:
            demos = [
                InboxMsg(account_email='demo@sendio.io', from_email='john.smith@acme.com',
                         subject='Re: Following up on our conversation', body='Hi, thanks for reaching out! I am interested in learning more about your product. Could we schedule a call?',
                         category='interested', is_read=False),
                InboxMsg(account_email='demo@sendio.io', from_email='sarah@techcorp.com',
                         subject='Re: Quick question about pricing', body='Thanks for the info. I will be out of office until next Monday. Will get back to you then.',
                         category='oof', is_read=True),
                InboxMsg(account_email='demo@sendio.io', from_email='mike@startup.io',
                         subject='Not interested', body='Please remove me from your list.',
                         category='not_interested', is_read=False),
            ]
            for d in demos:
                db.session.add(d)
            db.session.commit()


if __name__ == '__main__':
    create_defaults()
    print('🚀 Sendio backend running on http://localhost:5000')
    app.run(debug=True, port=5000, host='0.0.0.0')
