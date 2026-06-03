# 📋 KẾ HOẠCH MIGRATION BACKEND - 4 TUẦN

## 🎯 Mục tiêu
Push code backend từ dự án hiện tại lên repo mới https://github.com/TuyenTrungLe/DDI-Safe theo từng giai đoạn, đảm bảo mỗi commit đều có thể chạy được và có tài liệu rõ ràng.

---

## 📊 Tổng quan cấu trúc Backend

### Backend hiện tại bao gồm:
```
Backend Components:
├── app/                          # FastAPI application
│   ├── agents/                   # LangGraph agents & tools
│   ├── api/routes/              # API endpoints
│   ├── core/                    # Business logic & config
│   └── models/                  # Pydantic models
├── Drug Interaction Core Files:
│   ├── drug_interaction_graph.py    # Graph database
│   ├── drug_agent.py                # Main agent logic
│   ├── drug_embedding_generator.py  # ML embeddings
│   └── drug_embeddings_*.npy/json   # Trained embeddings
├── Data Files:
│   ├── db_drug_interactions.csv     # Drug interaction data
│   ├── drug_interactions.graphml    # Graph data
│   └── unique_drugs.txt             # Drug list
└── Configuration:
    ├── requirements.txt
    ├── .env (cần tạo)
    └── README.md
```

---

## 📅 KẾ HOẠCH 4 TUẦN

## **TUẦN 1: Setup & Core Foundation** (Ngày 1-7)

### 🎯 Mục tiêu: Tạo nền tảng cơ bản có thể chạy được

### **Ngày 1-2: Setup Repository & Basic Structure**

#### ✅ Task 1.1: Khởi tạo cấu trúc cơ bản
```bash
# Tạo cấu trúc thư mục trong repo mới
cd DDI-Safe
mkdir -p backend
cd backend

# Tạo cấu trúc cơ bản
mkdir -p app/{api,core,models,agents}
mkdir -p app/api/routes
mkdir -p data
mkdir -p tests
mkdir -p docs
```

#### ✅ Task 1.2: Copy files cơ bản nhất
```bash
# Copy từ dự án cũ (DDI-Safe(demo))
# Copy requirements.txt
cp ../DDI-Safe\(demo\)/requirements.txt backend/

# Copy __init__ files
cp ../DDI-Safe\(demo\)/app/__init__.py backend/app/
```

#### ✅ Task 1.3: Tạo .gitignore cho backend
```bash
# Tạo file backend/.gitignore
```

**Nội dung .gitignore:**
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Data files (sẽ thêm sau)
*.npy
*.graphml

# Logs
*.log
logs/

# Testing
.pytest_cache/
.coverage
htmlcov/

# OS
.DS_Store
Thumbs.db
```

#### ✅ Task 1.4: Tạo README.md cơ bản
```bash
# Tạo backend/README.md
```

#### 📝 Commit 1:
```bash
git add backend/
git commit -m "feat: Initialize backend structure and configuration

- Add basic folder structure (app, data, tests, docs)
- Add requirements.txt with all dependencies
- Add .gitignore for Python backend
- Add initial README.md

Status: Basic structure ready, not runnable yet"
git push origin main
```

---

### **Ngày 3-4: Core Configuration & Database**

#### ✅ Task 1.5: Setup Core Configuration
```bash
# Copy core configuration files
cp ../DDI-Safe\(demo\)/app/core/config.py backend/app/core/
cp ../DDI-Safe\(demo\)/app/core/__init__.py backend/app/core/
```

#### ✅ Task 1.6: Tạo .env.example
```bash
# Tạo backend/.env.example
```

**Nội dung .env.example:**
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# Cloudinary Configuration (optional for now)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Graph Database
GRAPH_FILE_PATH=data/drug_interactions.graphml
```

#### ✅ Task 1.7: Copy Drug Interaction Graph Core
```bash
# Copy graph core file
cp ../DDI-Safe\(demo\)/drug_interaction_graph.py backend/app/core/

# Copy initial data file
cp ../DDI-Safe\(demo\)/db_drug_interactions.csv backend/data/
```

#### 📝 Commit 2:
```bash
git add backend/
git commit -m "feat: Add core configuration and graph database

- Add config.py with settings management
- Add .env.example with all required environment variables
- Add drug_interaction_graph.py for graph database operations
- Add initial drug interaction data (CSV)

Status: Configuration complete, graph module added"
git push origin main
```

---

### **Ngày 5-6: Pydantic Models & Basic API**

#### ✅ Task 1.8: Add Pydantic Models
```bash
# Copy models
cp ../DDI-Safe\(demo\)/app/models/*.py backend/app/models/
```

#### ✅ Task 1.9: Create Basic FastAPI App
```bash
# Copy main.py
cp ../DDI-Safe\(demo\)/app/main.py backend/app/

# Copy health route
cp ../DDI-Safe\(demo\)/app/api/routes/health.py backend/app/api/routes/
```

#### ✅ Task 1.10: Tạo requirements-dev.txt
```bash
# Tạo backend/requirements-dev.txt
```

**Nội dung:**
```
-r requirements.txt
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx>=0.24.0
black>=23.0.0
flake8>=6.0.0
```

#### 📝 Commit 3:
```bash
git add backend/
git commit -m "feat: Add API models and basic FastAPI application

- Add Pydantic request/response models
- Add main FastAPI app with CORS configuration
- Add health check endpoint
- Add development dependencies

Status: Basic API server runnable (health check only)"
git push origin main
```

---

### **Ngày 7: Testing & Documentation**

#### ✅ Task 1.11: Test Basic Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Test import
python -c "from app.main import app; print('✅ Import successful')"

# Run server (should work)
uvicorn app.main:app --reload
# Test: http://localhost:8000/docs
```

#### ✅ Task 1.12: Write Setup Documentation
```bash
# Update backend/README.md với hướng dẫn setup chi tiết
```

#### ✅ Task 1.13: Create Quick Start Guide
```bash
# Tạo backend/docs/SETUP.md
```

#### 📝 Commit 4:
```bash
git add backend/
git commit -m "docs: Add comprehensive setup and testing documentation

- Add detailed README with setup instructions
- Add SETUP.md with step-by-step guide
- Verify basic API server runs successfully

Status: Week 1 Complete - Basic runnable API ✅"
git push origin main
```

**📊 Deliverables Tuần 1:**
- ✅ Cấu trúc backend hoàn chỉnh
- ✅ Configuration & environment setup
- ✅ Graph database module
- ✅ Basic FastAPI app có thể chạy
- ✅ Health check endpoint hoạt động
- ✅ Documentation đầy đủ

---

## **TUẦN 2: Drug Agent Core** (Ngày 8-14)

### 🎯 Mục tiêu: Implement drug agent logic & embeddings

### **Ngày 8-9: Drug Agent Foundation**

#### ✅ Task 2.1: Add Drug Mapper
```bash
# Copy drug mapper
cp ../DDI-Safe\(demo\)/app/core/drug_mapper.py backend/app/core/

# Copy unique drugs
cp ../DDI-Safe\(demo\)/unique_drugs.txt backend/data/
```

#### ✅ Task 2.2: Add Drug Agent Core
```bash
# Copy drug agent
cp ../DDI-Safe\(demo\)/drug_agent.py backend/app/core/
```

#### ✅ Task 2.3: Update Core Agent Manager
```bash
# Copy agent manager
cp ../DDI-Safe\(demo\)/app/core/agent.py backend/app/core/
```

#### 📝 Commit 5:
```bash
git add backend/
git commit -m "feat: Add drug agent core logic

- Add drug_mapper.py for drug name mapping
- Add drug_agent.py with main agent logic
- Add agent.py for agent lifecycle management
- Add unique_drugs.txt for drug reference

Status: Core agent logic implemented"
git push origin main
```

---

### **Ngày 10-11: ML Embeddings & Search**

#### ✅ Task 2.4: Add Embedding Generator
```bash
# Copy embedding files
cp ../DDI-Safe\(demo\)/drug_embedding_generator.py backend/app/core/
cp ../DDI-Safe\(demo\)/generate_drug_embeddings.py backend/scripts/
```

#### ✅ Task 2.5: Generate & Add Embeddings
```bash
# Generate embeddings (nếu chưa có)
cd backend
python scripts/generate_drug_embeddings.py

# Hoặc copy embeddings có sẵn
cp ../DDI-Safe\(demo\)/drug_embeddings_embeddings.npy backend/data/
cp ../DDI-Safe\(demo\)/drug_embeddings_mapping.json backend/data/
```

#### ✅ Task 2.6: Update .gitignore
```bash
# Update backend/.gitignore to track small embeddings
# Nhưng ignore nếu files quá lớn (>100MB)
```

#### 📝 Commit 6:
```bash
git add backend/
git commit -m "feat: Add ML embeddings for drug similarity search

- Add drug_embedding_generator.py for ML-based search
- Add script to generate embeddings
- Add pre-generated embeddings data
- Update requirements for sentence-transformers

Status: ML-powered drug search enabled"
git push origin main
```

---

### **Ngày 12-13: LangGraph Agents & Tools**

#### ✅ Task 2.7: Add LangGraph Structure
```bash
# Copy agents folder
cp ../DDI-Safe\(demo\)/app/agents/*.py backend/app/agents/
```

#### ✅ Task 2.8: Add Agent Tools
```bash
# Verify all tools are copied:
# - drug_agent.py
# - medical_specialist_agent.py
# - drug_name_extract_agent.py
# - drug_name_mapper_tool.py
# - enhanced_tools.py
# - tools.py
# - graph.py
# - state.py
# - models.py
```

#### 📝 Commit 7:
```bash
git add backend/
git commit -m "feat: Integrate LangGraph multi-agent system

- Add LangGraph agent orchestration
- Add specialized agents (drug, medical, name extraction)
- Add agent tools and state management
- Add graph-based workflow

Status: Multi-agent system complete"
git push origin main
```

---

### **Ngày 14: Integration Testing**

#### ✅ Task 2.9: Add Stats API
```bash
# Copy stats route
cp ../DDI-Safe\(demo\)/app/api/routes/stats.py backend/app/api/routes/
```

#### ✅ Task 2.10: Full Integration Test
```bash
# Test với OpenAI API key
# Tạo backend/.env từ .env.example và điền API key

# Run server
uvicorn app.main:app --reload

# Test stats endpoint
curl http://localhost:8000/stats

# Test với Postman/Thunder Client
```

#### ✅ Task 2.11: Write Agent Documentation
```bash
# Tạo backend/docs/AGENTS.md với giải thích về agents
```

#### 📝 Commit 8:
```bash
git add backend/
git commit -m "feat: Add stats API and complete agent integration

- Add stats endpoint for database statistics
- Add comprehensive agent documentation
- Verify full agent workflow integration

Status: Week 2 Complete - Agent system fully functional ✅"
git push origin main
```

**📊 Deliverables Tuần 2:**
- ✅ Drug agent hoàn chỉnh với LLM
- ✅ ML embeddings cho similarity search
- ✅ LangGraph multi-agent system
- ✅ Stats API endpoint
- ✅ Integration testing passed

---

## **TUẦN 3: API Endpoints & Features** (Ngày 15-21)

### 🎯 Mục tiêu: Hoàn thiện tất cả API endpoints

### **Ngày 15-16: Query & Chat Endpoints**

#### ✅ Task 3.1: Add Query Endpoint
```bash
# Copy queries route
cp ../DDI-Safe\(demo\)/app/api/routes/queries.py backend/app/api/routes/
```

#### ✅ Task 3.2: Test Query Functionality
```bash
# Test với các queries:
# 1. "Aspirin và Ibuprofen có tương tác không?"
# 2. "Tôi đang dùng Warfarin, có thể dùng thêm Aspirin không?"
# 3. "Liều lượng an toàn của Paracetamol?"
```

#### ✅ Task 3.3: Add Error Handling
```bash
# Review và improve error handling trong queries.py
```

#### 📝 Commit 9:
```bash
git add backend/
git commit -m "feat: Add query and chat endpoints

- Add query endpoint for drug interaction checks
- Add chat endpoint for conversational interface
- Implement comprehensive error handling
- Add request validation

Status: Query API operational"
git push origin main
```

---

### **Ngày 17-18: Medicine Cabinet Feature**

#### ✅ Task 3.4: Add Medicine Cabinet Core
```bash
# Copy medicine cabinet
cp ../DDI-Safe\(demo\)/app/core/medicine_cabinet.py backend/app/core/
```

#### ✅ Task 3.5: Add Medicine Cabinet API
```bash
# Copy medicine cabinet route
cp ../DDI-Safe\(demo\)/app/api/routes/medicine_cabinet.py backend/app/api/routes/
```

#### ✅ Task 3.6: Test Medicine Cabinet
```bash
# Test CRUD operations:
# POST /medicine-cabinet/add
# GET /medicine-cabinet/list
# DELETE /medicine-cabinet/remove/{drug_name}
# POST /medicine-cabinet/check
```

#### 📝 Commit 10:
```bash
git add backend/
git commit -m "feat: Implement medicine cabinet feature

- Add medicine cabinet core logic
- Add CRUD endpoints for drug management
- Add interaction checking for saved drugs
- Add comprehensive testing

Status: Medicine cabinet feature complete"
git push origin main
```

---

### **Ngày 19-20: Image Upload (Cloudinary)**

#### ✅ Task 3.7: Add Cloudinary Utils
```bash
# Copy cloudinary utilities
cp ../DDI-Safe\(demo\)/app/core/cloudinary_utils.py backend/app/core/
```

#### ✅ Task 3.8: Update Query Endpoint for Images
```bash
# Update queries.py để hỗ trợ image upload
# Verify multipart/form-data handling
```

#### ✅ Task 3.9: Test Image Upload
```bash
# Test với ảnh prescription
# Verify OCR + drug extraction + interaction check
```

#### 📝 Commit 11:
```bash
git add backend/
git commit -m "feat: Add image upload and OCR processing

- Add Cloudinary integration for image storage
- Add image upload endpoint
- Integrate OCR for prescription reading
- Update query endpoint for multipart data

Status: Image processing feature complete"
git push origin main
```

---

### **Ngày 21: API Documentation**

#### ✅ Task 3.10: Enhance API Documentation
```bash
# Update all endpoint docstrings
# Add examples to Swagger/OpenAPI docs
```

#### ✅ Task 3.11: Create API Documentation
```bash
# Tạo backend/docs/API.md với:
# - All endpoints
# - Request/Response examples
# - Error codes
# - Rate limiting (nếu có)
```

#### ✅ Task 3.12: Add Postman Collection
```bash
# Export Postman collection
# Add to backend/docs/DDI-Safe.postman_collection.json
```

#### 📝 Commit 12:
```bash
git add backend/
git commit -m "docs: Complete API documentation

- Add comprehensive API documentation
- Add Postman collection for testing
- Enhance OpenAPI/Swagger docs with examples
- Add troubleshooting guide

Status: Week 3 Complete - All APIs documented ✅"
git push origin main
```

**📊 Deliverables Tuần 3:**
- ✅ Query & Chat endpoints
- ✅ Medicine Cabinet full CRUD
- ✅ Image upload & OCR
- ✅ Complete API documentation
- ✅ Postman collection

---

## **TUẦN 4: Testing, Optimization & Deployment** (Ngày 22-28)

### 🎯 Mục tiêu: Testing, optimization và deployment ready

### **Ngày 22-23: Unit & Integration Tests**

#### ✅ Task 4.1: Add Test Files
```bash
# Copy test files
cp ../DDI-Safe\(demo\)/test_*.py backend/tests/

# Organize tests
mkdir backend/tests/unit
mkdir backend/tests/integration
```

#### ✅ Task 4.2: Write Additional Tests
```bash
# Add tests cho:
# - Medicine cabinet
# - Image upload
# - Error scenarios
```

#### ✅ Task 4.3: Run Full Test Suite
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

#### 📝 Commit 13:
```bash
git add backend/
git commit -m "test: Add comprehensive test suite

- Add unit tests for core modules
- Add integration tests for API endpoints
- Add test coverage reporting
- Document testing procedures

Coverage: >80%"
git push origin main
```

---

### **Ngày 24-25: Performance Optimization**

#### ✅ Task 4.4: Add Caching
```bash
# Implement caching cho:
# - Drug embeddings (in-memory)
# - Frequent queries (Redis optional)
# - Graph traversal results
```

#### ✅ Task 4.5: Add Logging
```bash
# Setup structured logging
# Add log rotation
# Add monitoring endpoints
```

#### ✅ Task 4.6: Optimize Dependencies
```bash
# Review requirements.txt
# Remove unused dependencies
# Pin versions for production
```

#### 📝 Commit 14:
```bash
git add backend/
git commit -m "perf: Add caching and optimize performance

- Implement in-memory caching for embeddings
- Add structured logging system
- Optimize database queries
- Review and cleanup dependencies

Status: Performance optimized"
git push origin main
```

---

### **Ngày 26-27: Deployment Preparation**

#### ✅ Task 4.7: Add Docker Support
```bash
# Tạo backend/Dockerfile
# Tạo backend/docker-compose.yml
# Test Docker build
```

**Dockerfile example:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### ✅ Task 4.8: Add Production Config
```bash
# Tạo backend/app/core/prod_config.py
# Add production security settings
```

#### ✅ Task 4.9: Create Deployment Guide
```bash
# Tạo backend/docs/DEPLOYMENT.md
```

#### 📝 Commit 15:
```bash
git add backend/
git commit -m "deploy: Add Docker and deployment configuration

- Add Dockerfile for containerization
- Add docker-compose.yml for easy setup
- Add production configuration
- Add deployment documentation

Status: Deployment ready"
git push origin main
```

---

### **Ngày 28: Final Review & Release**

#### ✅ Task 4.10: Security Review
```bash
# Check:
# - Environment variables not committed
# - API key handling
# - Input validation
# - CORS settings
# - Rate limiting
```

#### ✅ Task 4.11: Update Main README
```bash
# Update backend/README.md với:
# - Features overview
# - Quick start
# - Architecture diagram
# - Links to docs
# - Contributing guidelines
```

#### ✅ Task 4.12: Create Release
```bash
# Tag version
git tag -a v1.0.0-backend -m "Backend v1.0.0 - Full feature release"
git push origin v1.0.0-backend
```

#### ✅ Task 4.13: Create CHANGELOG
```bash
# Tạo backend/CHANGELOG.md
```

#### 📝 Commit 16:
```bash
git add backend/
git commit -m "docs: Finalize documentation and create v1.0.0 release

- Complete security review
- Update main README with features overview
- Add CHANGELOG
- Add contributing guidelines

Status: Backend v1.0.0 Released 🎉"
git push origin main
git push origin v1.0.0-backend
```

**📊 Deliverables Tuần 4:**
- ✅ Complete test suite (>80% coverage)
- ✅ Performance optimizations
- ✅ Docker support
- ✅ Deployment documentation
- ✅ Security review passed
- ✅ v1.0.0 Release

---

## 🎯 SUMMARY: Lộ trình 4 tuần

| Tuần | Giai đoạn | Deliverables | Commits |
|------|-----------|--------------|---------|
| **1** | Setup & Foundation | Cấu trúc cơ bản, Config, Graph DB, Basic API | 4 commits |
| **2** | Drug Agent Core | Agent logic, ML embeddings, LangGraph, Stats API | 4 commits |
| **3** | API Endpoints | Query, Chat, Medicine Cabinet, Image Upload, Docs | 4 commits |
| **4** | Testing & Deploy | Tests, Optimization, Docker, Release | 4 commits |

**Tổng: 16 commits chính + các commits nhỏ khác**

---

## 📝 Checklist cho mỗi commit

Trước khi commit, luôn kiểm tra:
- [ ] Code chạy được (không có syntax error)
- [ ] Dependencies được cập nhật trong requirements.txt
- [ ] .env.example được cập nhật nếu có biến mới
- [ ] README/docs được cập nhật
- [ ] Không commit sensitive data (.env, API keys)
- [ ] Commit message rõ ràng theo format: `type: description`

**Commit message types:**
- `feat`: Feature mới
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `perf`: Performance
- `refactor`: Code refactoring
- `chore`: Maintenance

---

## 🚀 Bắt đầu ngay

### Bước đầu tiên (Ngay bây giờ):

```bash
# 1. Di chuyển đến repo mới
cd D:\Google Hackathon\DDI-Safe

# 2. Tạo branch cho backend
git checkout -b backend-setup

# 3. Bắt đầu Task 1.1
mkdir backend
cd backend
mkdir -p app/{api,core,models,agents}
mkdir -p app/api/routes
mkdir -p data
mkdir -p tests
mkdir -p docs
mkdir -p scripts

# 4. Tạo __init__.py files
touch app/__init__.py
touch app/api/__init__.py
touch app/api/routes/__init__.py
touch app/core/__init__.py
touch app/models/__init__.py
touch app/agents/__init__.py

# 5. Follow từng task trong TUẦN 1
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Luôn test trước khi commit**: Đảm bảo code chạy được
2. **Không rush**: Mỗi commit phải hoàn chỉnh và có ý nghĩa
3. **Backup**: Luôn giữ bản backup của dự án cũ
4. **Documentation**: Viết docs ngay khi implement feature
5. **Environment**: Không bao giờ commit .env file
6. **Dependencies**: Pin versions trong production
7. **Testing**: Viết tests ngay khi implement feature

---

## 📞 Troubleshooting

Nếu gặp vấn đề:
1. Check error logs cẩn thận
2. Verify .env file đã setup đúng
3. Kiểm tra dependencies đã install đủ
4. Test từng module riêng lẻ
5. Đọc documentation trong docs/

---

## 🎊 Kết luận

Sau 4 tuần, bạn sẽ có:
- ✅ Backend hoàn chỉnh, production-ready
- ✅ Full documentation
- ✅ Comprehensive tests
- ✅ Docker support
- ✅ Clean git history với 16+ meaningful commits
- ✅ Ready for frontend integration

**Chúc bạn thành công! 🚀**
