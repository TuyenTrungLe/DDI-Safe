# 🚀 HƯỚNG DẪN CHI TIẾT TỪNG BƯỚC - TUẦN 1

## 📋 Chuẩn bị

### Yêu cầu:
- Git đã cài đặt
- Python 3.11+
- VS Code hoặc editor khác
- Repo https://github.com/TuyenTrungLe/DDI-Safe đã clone về

---

## 🎯 TUẦN 1 - NGÀY 1-2: Setup Repository & Basic Structure

### ⏰ Thời gian: 2-3 giờ

### 📍 Bước 1: Di chuyển đến repo mới

```powershell
# Mở PowerShell/Terminal
cd D:\Google Hackathon

# Kiểm tra repo mới đã clone chưa
cd DDI-Safe
git status

# Tạo branch mới cho backend
git checkout -b backend-week1-setup
```

**✅ Kiểm tra:** `git branch` sẽ hiện `* backend-week1-setup`

---

### 📍 Bước 2: Tạo cấu trúc thư mục backend

```powershell
# Tạo thư mục backend chính
mkdir backend
cd backend

# Tạo cấu trúc app
mkdir app
cd app
mkdir api, core, models, agents
cd api
mkdir routes
New-Item -Path "__init__.py" -ItemType File
cd routes
New-Item -Path "__init__.py" -ItemType File
cd ../..
New-Item -Path "__init__.py" -ItemType File
cd core
New-Item -Path "__init__.py" -ItemType File
cd ../models
New-Item -Path "__init__.py" -ItemType File
cd ../agents
New-Item -Path "__init__.py" -ItemType File
cd ../..

# Tạo các thư mục khác
mkdir data, tests, docs, scripts

# Quay về thư mục backend
cd ..
```

**Cấu trúc sau khi tạo:**
```
backend/
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       └── __init__.py
│   ├── core/
│   │   └── __init__.py
│   ├── models/
│   │   └── __init__.py
│   └── agents/
│       └── __init__.py
├── data/
├── tests/
├── docs/
└── scripts/
```

**✅ Kiểm tra:** Chạy `tree /F` hoặc `ls -R` để xem cấu trúc

---

### 📍 Bước 3: Copy requirements.txt

```powershell
# Từ thư mục backend/
# Copy file requirements.txt từ dự án cũ
Copy-Item "D:\Google Hackathon\DDI-Safe(demo)\requirements.txt" -Destination "requirements.txt"
```

**✅ Kiểm tra:** `cat requirements.txt` hoặc mở file xem có nội dung

---

### 📍 Bước 4: Tạo .gitignore

```powershell
# Tạo file .gitignore
New-Item -Path ".gitignore" -ItemType File
```

**Mở file `.gitignore` và paste nội dung sau:**

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual Environment
env/
venv/
ENV/
env.bak/
venv.bak/
.venv/

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Data files (will add later with Git LFS if needed)
*.npy
*.graphml
data/drug_embeddings_*.npy
data/drug_embeddings_*.json

# Logs
*.log
logs/
*.log.*

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/
.hypothesis/

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.bak
*.swp
*~.nib

# Database
*.db
*.sqlite
*.sqlite3
```

**✅ Kiểm tra:** File .gitignore đã có nội dung

---

### 📍 Bước 5: Tạo README.md cơ bản

```powershell
# Tạo README
New-Item -Path "README.md" -ItemType File
```

**Mở `README.md` và paste nội dung:**

```markdown
# DDI-Safe Backend

Drug-Drug Interaction Safety System - Backend API

## 🚀 Overview

Backend API for the DDI-Safe application, providing drug interaction checking, medicine cabinet management, and AI-powered medical consultation.

## 📋 Current Status

**Version:** 0.1.0 (Week 1 - Initial Setup)  
**Stage:** Development - Basic Structure

### Implemented Features:
- ✅ Project structure setup
- ⏳ Configuration system (coming in day 3-4)
- ⏳ API endpoints (coming in week 2-3)
- ⏳ Database integration (coming in day 3-4)

## 🏗️ Project Structure

```
backend/
├── app/                    # Main application
│   ├── api/               # API routes
│   ├── core/              # Core business logic
│   ├── models/            # Pydantic models
│   └── agents/            # LangGraph agents
├── data/                  # Data files
├── tests/                 # Test suite
├── docs/                  # Documentation
└── scripts/               # Utility scripts
```

## 🛠️ Tech Stack

- **Framework:** FastAPI
- **AI/ML:** LangChain, LangGraph, OpenAI
- **Database:** Graph database (igraph)
- **Embeddings:** Sentence Transformers
- **Python:** 3.11+

## 📦 Installation

### Prerequisites
- Python 3.11 or higher
- pip package manager
- Virtual environment (recommended)

### Setup

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
.\venv\Scripts\activate.bat
# Linux/Mac:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file (will be added in day 3-4)
# cp .env.example .env
# Edit .env with your configuration
```

## 🚀 Running the Application

```bash
# Development mode (will be functional after week 1)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Access API documentation
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

## 📝 Development Timeline

### Week 1: Setup & Core Foundation (Current)
- [x] Basic structure
- [x] Requirements setup
- [ ] Configuration system
- [ ] Database core
- [ ] Basic API server

### Week 2: Drug Agent Core
- [ ] Agent implementation
- [ ] ML embeddings
- [ ] LangGraph integration

### Week 3: API Endpoints
- [ ] Query endpoints
- [ ] Medicine cabinet
- [ ] Image upload

### Week 4: Testing & Deployment
- [ ] Test suite
- [ ] Docker setup
- [ ] Documentation

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Coming soon
- [API Documentation](docs/API.md) - Coming soon
- [Architecture](docs/ARCHITECTURE.md) - Coming soon

## 🤝 Contributing

This project is under active development. More contribution guidelines coming soon.

## 📄 License

[To be determined]

## 👥 Team

Google Hackathon DevFest 2025

---

**Last Updated:** Week 1, Day 1-2
**Next Milestone:** Core configuration (Day 3-4)
```

**✅ Kiểm tra:** README.md đã có nội dung

---

### 📍 Bước 6: First Commit

```powershell
# Về thư mục gốc của repo
cd D:\Google Hackathon\DDI-Safe

# Check status
git status

# Add tất cả files
git add backend/

# Kiểm tra những gì sẽ được commit
git status

# Commit
git commit -m "feat: Initialize backend structure and configuration

- Add basic folder structure (app, data, tests, docs)
- Add requirements.txt with all dependencies
- Add .gitignore for Python backend
- Add initial README.md

Status: Basic structure ready, not runnable yet"

# Push lên GitHub
git push -u origin backend-week1-setup
```

**✅ Kiểm tra:** 
- Vào https://github.com/TuyenTrungLe/DDI-Safe
- Sẽ thấy branch mới `backend-week1-setup`
- Click vào sẽ thấy thư mục `backend/` với cấu trúc đã tạo

---

## 🎯 TUẦN 1 - NGÀY 3-4: Core Configuration & Database

### ⏰ Thời gian: 3-4 giờ

### 📍 Bước 7: Copy core configuration

```powershell
cd D:\Google Hackathon\DDI-Safe\backend

# Copy config.py
Copy-Item "D:\Google Hackathon\DDI-Safe(demo)\app\core\config.py" -Destination "app\core\config.py"

# Copy __init__.py của core
Copy-Item "D:\Google Hackathon\DDI-Safe(demo)\app\core\__init__.py" -Destination "app\core\__init__.py"
```

**✅ Kiểm tra:** `cat app\core\config.py` sẽ thấy nội dung

---

### 📍 Bước 8: Tạo .env.example

```powershell
New-Item -Path ".env.example" -ItemType File
```

**Mở `.env.example` và paste:**

```env
# ==============================================
# DDI-SAFE BACKEND CONFIGURATION
# ==============================================

# ----------------------------------------------
# OpenAI Configuration (REQUIRED)
# ----------------------------------------------
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# ----------------------------------------------
# API Server Configuration
# ----------------------------------------------
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True
API_TITLE=DDI-Safe API
API_DESCRIPTION=Drug-Drug Interaction Safety System
API_VERSION=1.0.0

# ----------------------------------------------
# CORS Configuration
# ----------------------------------------------
# Allowed origins (comma-separated for multiple origins)
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://localhost:5174"]
CORS_CREDENTIALS=True
CORS_METHODS=["*"]
CORS_HEADERS=["*"]

# ----------------------------------------------
# Cloudinary Configuration (OPTIONAL - for image upload)
# ----------------------------------------------
# Get credentials from: https://cloudinary.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ----------------------------------------------
# Database Configuration
# ----------------------------------------------
# Path to drug interaction graph file
GRAPH_FILE_PATH=data/drug_interactions.graphml

# Path to drug embeddings
DRUG_EMBEDDINGS_PATH=data/drug_embeddings_embeddings.npy
DRUG_MAPPING_PATH=data/drug_embeddings_mapping.json

# ----------------------------------------------
# LLM Configuration
# ----------------------------------------------
LLM_MODEL=gpt-4o-mini
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=1000

# ----------------------------------------------
# Development/Production Mode
# ----------------------------------------------
ENVIRONMENT=development
DEBUG=True

# ----------------------------------------------
# Logging Configuration
# ----------------------------------------------
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

**✅ Kiểm tra:** File .env.example đã tạo

---

### 📍 Bước 9: Copy Drug Interaction Graph

```powershell
# Copy drug_interaction_graph.py
Copy-Item "D:\Google Hackathon\DDI-Safe(demo)\drug_interaction_graph.py" -Destination "app\core\drug_interaction_graph.py"

# Copy data CSV
Copy-Item "D:\Google Hackathon\DDI-Safe(demo)\db_drug_interactions.csv" -Destination "data\db_drug_interactions.csv"
```

**✅ Kiểm tra:** 
- `cat app\core\drug_interaction_graph.py` có nội dung
- `cat data\db_drug_interactions.csv` có data

---

### 📍 Bước 10: Second Commit

```powershell
cd D:\Google Hackathon\DDI-Safe

# Check changes
git status

# Add files
git add backend/

# Commit
git commit -m "feat: Add core configuration and graph database

- Add config.py with settings management
- Add .env.example with all required environment variables
- Add drug_interaction_graph.py for graph database operations
- Add initial drug interaction data (CSV)

Status: Configuration complete, graph module added"

# Push
git push origin backend-week1-setup
```

---

## 🎯 TUẦN 1 - NGÀY 5-6: Pydantic Models & Basic API

### ⏰ Thời gian: 3-4 giờ

### 📍 Bước 11: Copy Pydantic Models

```powershell
cd D:\Google Hackathon\DDI-Safe\backend

# Copy tất cả models
Copy-Item "D:\Google Hackathon\DDI-Safe(demo)\app\models\*.py" -Destination "app\models\"
```

**✅ Kiểm tra:** `ls app\models\` sẽ thấy:
- `__init__.py`
- `requests.py`
- `responses.py`

---

### 📍 Bước 12: Copy Main FastAPI App

```powershell
# Copy main.py
Copy-Item "D:\Google Hackathon\DDI-Safe(demo)\app\main.py" -Destination "app\main.py"

# Copy health route
Copy-Item "D:\Google Hackathon\DDI-Safe(demo)\app\api\routes\health.py" -Destination "app\api\routes\health.py"

# Copy __init__ files nếu chưa có
Copy-Item "D:\Google Hackathon\DDI-Safe(demo)\app\api\__init__.py" -Destination "app\api\__init__.py" -Force
Copy-Item "D:\Google Hackathon\DDI-Safe(demo)\app\api\routes\__init__.py" -Destination "app\api\routes\__init__.py" -Force
```

**✅ Kiểm tra:** Files đã được copy

---

### 📍 Bước 13: Tạo requirements-dev.txt

```powershell
New-Item -Path "requirements-dev.txt" -ItemType File
```

**Mở `requirements-dev.txt` và paste:**

```txt
# Development dependencies
-r requirements.txt

# Testing
pytest>=7.4.0
pytest-asyncio>=0.21.0
pytest-cov>=4.1.0
httpx>=0.24.0

# Code quality
black>=23.0.0
flake8>=6.0.0
isort>=5.12.0
mypy>=1.5.0

# Development tools
ipython>=8.12.0
ipdb>=0.13.13
```

---

### 📍 Bước 14: Third Commit

```powershell
cd D:\Google Hackathon\DDI-Safe

git add backend/
git commit -m "feat: Add API models and basic FastAPI application

- Add Pydantic request/response models
- Add main FastAPI app with CORS configuration
- Add health check endpoint
- Add development dependencies

Status: Basic API server runnable (health check only)"

git push origin backend-week1-setup
```

---

## 🎯 TUẦN 1 - NGÀY 7: Testing & Documentation

### ⏰ Thời gian: 2-3 giờ

### 📍 Bước 15: Test cài đặt và chạy server

```powershell
cd D:\Google Hackathon\DDI-Safe\backend

# Tạo virtual environment
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1

# Nếu gặp lỗi execution policy:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt

# Tạo file .env từ .env.example
Copy-Item ".env.example" -Destination ".env"

# Mở .env và thêm OPENAI_API_KEY thật của bạn
# notepad .env

# Test import (tạm thời bỏ qua lỗi vì chưa có tất cả dependencies)
python -c "from app.main import app; print('✅ Import successful')"
```

**Nếu có lỗi:** 
- Kiểm tra Python version: `python --version` (phải >= 3.11)
- Kiểm tra pip: `pip --version`
- Reinstall dependencies: `pip install -r requirements.txt --upgrade`

---

### 📍 Bước 16: Thử chạy server (có thể có lỗi - bình thường)

```powershell
# Thử chạy (có thể lỗi vì thiếu dependencies)
uvicorn app.main:app --reload

# Nếu chạy được, mở browser:
# http://localhost:8000/docs
```

**Nếu lỗi:** Không sao, sẽ fix ở tuần 2. Note lại lỗi gì.

---

### 📍 Bước 17: Tạo docs/SETUP.md

```powershell
New-Item -Path "docs\SETUP.md" -ItemType File
```

**Mở `docs/SETUP.md` và paste:**

```markdown
# Setup Guide - DDI-Safe Backend

## Prerequisites

### Required Software
- **Python:** 3.11 or higher
- **pip:** Latest version
- **Git:** For version control
- **Code Editor:** VS Code recommended

### Required Accounts
- **OpenAI API Key:** https://platform.openai.com/api-keys
- **Cloudinary Account:** (Optional) https://cloudinary.com

---

## Step-by-Step Setup

### 1. Clone Repository

```bash
git clone https://github.com/TuyenTrungLe/DDI-Safe.git
cd DDI-Safe/backend
```

### 2. Create Virtual Environment

```bash
# Create venv
python -m venv venv

# Activate
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Windows CMD:
.\venv\Scripts\activate.bat

# Linux/Mac:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
# Install production dependencies
pip install -r requirements.txt

# For development
pip install -r requirements-dev.txt
```

### 4. Environment Configuration

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
notepad .env  # Windows
nano .env     # Linux/Mac
```

**Required configuration in .env:**

```env
# MUST HAVE
OPENAI_API_KEY=sk-your-actual-key-here

# Optional (can use defaults)
API_PORT=8000
CORS_ORIGINS=["http://localhost:3000"]
```

### 5. Verify Installation

```bash
# Test imports
python -c "from app.main import app; print('✅ Success')"

# Check Python version
python --version  # Should be 3.11+

# Check installed packages
pip list
```

### 6. Run Development Server

```bash
# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Server will start at:
# http://localhost:8000
```

### 7. Test API

Open browser and go to:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

---

## Common Issues & Solutions

### Issue 1: "python not found"
**Solution:**
```bash
# Check if Python is installed
python --version
python3 --version

# If not installed, download from:
# https://www.python.org/downloads/
```

### Issue 2: "venv activation failed"
**Solution for Windows PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 3: "Module not found"
**Solution:**
```bash
# Ensure venv is activated (you should see (venv) in prompt)
# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

### Issue 4: "OpenAI API Error"
**Solution:**
- Check `.env` file has correct `OPENAI_API_KEY`
- Verify key at: https://platform.openai.com/api-keys
- Ensure key has credits/billing enabled

### Issue 5: "Port already in use"
**Solution:**
```bash
# Use different port
uvicorn app.main:app --reload --port 8001

# Or kill process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:8000 | xargs kill -9
```

---

## Development Workflow

### Daily Development
```bash
# 1. Activate venv
.\venv\Scripts\Activate.ps1

# 2. Pull latest changes
git pull origin main

# 3. Install any new dependencies
pip install -r requirements.txt

# 4. Run server
uvicorn app.main:app --reload
```

### Before Committing
```bash
# 1. Run tests (when available)
pytest

# 2. Check code format (optional)
black app/
flake8 app/

# 3. Commit
git add .
git commit -m "your message"
git push
```

---

## Next Steps

After setup:
1. Read [Architecture Documentation](ARCHITECTURE.md)
2. Review [API Documentation](API.md)
3. Follow [Development Guidelines](CONTRIBUTING.md)

---

## Getting Help

- Check documentation in `docs/`
- Review error logs
- Open issue on GitHub
```

---

### 📍 Bước 18: Update README với setup instructions

**Mở `backend/README.md` và update phần Installation:**

```markdown
## 📦 Installation

**Detailed setup guide:** See [docs/SETUP.md](docs/SETUP.md)

### Quick Start

```bash
# 1. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate    # Linux/Mac

# 2. Install dependencies
pip install -r requirements.txt

# 3. Setup environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Run server
uvicorn app.main:app --reload
```
```

---

### 📍 Bước 19: Fourth Commit - Hoàn thành Tuần 1

```powershell
cd D:\Google Hackathon\DDI-Safe

git add backend/
git commit -m "docs: Add comprehensive setup and testing documentation

- Add detailed SETUP.md with step-by-step guide
- Add troubleshooting section
- Update README with quick start
- Verify basic API structure

Status: Week 1 Complete - Basic runnable structure ✅"

git push origin backend-week1-setup
```

---

### 📍 Bước 20: Tạo Pull Request (Optional)

1. Vào https://github.com/TuyenTrungLe/DDI-Safe
2. Click "Pull requests" → "New pull request"
3. Base: `main` ← Compare: `backend-week1-setup`
4. Click "Create pull request"
5. Title: "Week 1: Backend Setup & Foundation"
6. Description:
```markdown
## Week 1 Completion ✅

### Implemented:
- ✅ Basic backend structure
- ✅ Requirements & dependencies
- ✅ Configuration system (.env)
- ✅ Graph database module
- ✅ Basic FastAPI app skeleton
- ✅ Comprehensive documentation

### Next Week:
- Drug agent core logic
- ML embeddings
- LangGraph integration

### How to Test:
1. Clone repo
2. Follow docs/SETUP.md
3. Run `uvicorn app.main:app --reload`
4. Visit http://localhost:8000/docs
```

7. **Nếu muốn merge:** Click "Merge pull request" → "Confirm merge"
8. **Nếu chưa:** Để PR mở, tiếp tục làm việc

---

## ✅ CHECKLIST TUẦN 1

Copy checklist này và check khi hoàn thành:

```markdown
### Ngày 1-2: Basic Structure
- [ ] Tạo cấu trúc thư mục backend
- [ ] Copy requirements.txt
- [ ] Tạo .gitignore
- [ ] Tạo README.md
- [ ] Commit 1 đã push

### Ngày 3-4: Configuration & Database
- [ ] Copy config.py
- [ ] Tạo .env.example
- [ ] Copy drug_interaction_graph.py
- [ ] Copy db_drug_interactions.csv
- [ ] Commit 2 đã push

### Ngày 5-6: Models & Basic API
- [ ] Copy Pydantic models
- [ ] Copy main.py và health route
- [ ] Tạo requirements-dev.txt
- [ ] Commit 3 đã push

### Ngày 7: Testing & Documentation
- [ ] Tạo venv và cài dependencies
- [ ] Test chạy server
- [ ] Tạo docs/SETUP.md
- [ ] Update README
- [ ] Commit 4 đã push
- [ ] (Optional) Tạo Pull Request

### Final Checks
- [ ] Tất cả 4 commits đã push lên GitHub
- [ ] README.md đầy đủ thông tin
- [ ] docs/SETUP.md có hướng dẫn chi tiết
- [ ] .env.example có tất cả configs cần thiết
- [ ] .gitignore đúng (không commit .env, __pycache__)
```

---

## 🎯 SAU KHI HOÀN THÀNH TUẦN 1

Bạn sẽ có:
1. ✅ Backend structure hoàn chỉnh
2. ✅ Configuration system
3. ✅ Graph database module
4. ✅ Basic FastAPI skeleton
5. ✅ 4 commits có ý nghĩa trên GitHub
6. ✅ Documentation đầy đủ

**Tiếp theo:** Bắt đầu Tuần 2 - Implement Drug Agent Core

---

## 📞 Cần Giúp Đỡ?

### Nếu gặp lỗi:
1. Đọc kỹ error message
2. Check docs/SETUP.md phần Troubleshooting
3. Google error message
4. Check Python version, pip version
5. Try reinstall dependencies

### Tips:
- **Commit thường xuyên**: Sau mỗi task nhỏ
- **Test trước khi commit**: Đảm bảo code không lỗi syntax
- **Đọc docs**: README và SETUP.md rất quan trọng
- **Keep calm**: Lỗi là bình thường, từ từ fix

---

**Chúc bạn thành công với Tuần 1! 🚀**

**Next:** [WEEK_2_GUIDE.md](WEEK_2_GUIDE.md) (sẽ tạo sau)
