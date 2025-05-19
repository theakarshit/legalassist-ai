import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))  # DON'T CHANGE THIS !!!

from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import uuid
import json
import time
import openai
from werkzeug.utils import secure_filename
import fitz  # PyMuPDF
import docx

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure OpenAI API
openai.api_key = "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"

# In-memory storage for documents (in a production app, use a database)
documents = {}

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    """Extract text from PDF file using PyMuPDF."""
    text = ""
    try:
        doc = fitz.open(file_path)
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""

def extract_text_from_docx(file_path):
    """Extract text from DOCX file using python-docx."""
    text = ""
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from DOCX: {e}")
        return ""

def generate_questions(document_text):
    """Generate 5 suggested questions based on document content using OpenAI."""
    try:
        start_time = time.time()
        
        response = openai.chat.completions.create(
            model="gpt-4",
            temperature=0.2,
            messages=[
                {"role": "system", "content": "You are a legal assistant. Your task is to suggest 5 intelligent questions someone might ask about the legal document provided."},
                {"role": "user", "content": f"Suggest 5 legal questions someone might ask based on this contract: {document_text[:10000]}..."}
            ]
        )
        
        # Calculate token usage
        token_usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
        
        # Extract questions from response
        questions = response.choices[0].message.content.strip().split("\n")
        # Clean up questions (remove numbering if present)
        cleaned_questions = []
        for q in questions:
            # Remove numbering patterns like "1.", "1)", "[1]", etc.
            q = q.strip()
            if q:
                import re
                q = re.sub(r'^(\d+[\.\)\]]\s*)', '', q)
                cleaned_questions.append(q.strip())
        
        # Take only 5 questions if more were generated
        cleaned_questions = cleaned_questions[:5]
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        return {
            "questions": cleaned_questions, 
            "token_usage": token_usage,
            "processing_time": processing_time
        }
    except Exception as e:
        print(f"Error generating questions: {e}")
        return {"questions": [], "token_usage": {}, "processing_time": 0}

def answer_question(document_text, question):
    """Answer a question based on document content using OpenAI."""
    try:
        start_time = time.time()
        
        response = openai.chat.completions.create(
            model="gpt-4",
            temperature=0.2,
            max_tokens=1000,
            messages=[
                {"role": "system", "content": "You are a legal assistant. Based only on the text provided, answer the user's question accurately and clearly. If the answer cannot be found in the document, state that clearly."},
                {"role": "user", "content": f"Document: {document_text}\n\nUser Question: {question}"}
            ]
        )
        
        # Calculate token usage
        token_usage = {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
        
        # Extract answer and find relevant segments for highlighting
        answer = response.choices[0].message.content.strip()
        
        # Simple approach to find relevant segments (in a real app, use embeddings)
        relevant_segments = find_relevant_segments(document_text, question, answer)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        return {
            "answer": answer, 
            "relevant_segments": relevant_segments,
            "token_usage": token_usage,
            "processing_time": processing_time
        }
    except Exception as e:
        print(f"Error answering question: {e}")
        return {"answer": f"Error: {str(e)}", "relevant_segments": [], "token_usage": {}, "processing_time": 0}

def find_relevant_segments(document_text, question, answer):
    """Find relevant segments in the document for highlighting."""
    # Simple approach: split document into sentences and find ones that contain keywords from the question and answer
    # In a production app, use embeddings and semantic search
    
    # Split document into sentences
    import re
    sentences = re.split(r'(?<=[.!?])\s+', document_text)
    
    # Extract keywords from question and answer
    keywords = set()
    for word in re.findall(r'\b\w+\b', question.lower() + " " + answer.lower()):
        if len(word) > 4:  # Only consider words longer than 4 characters
            keywords.add(word)
    
    # Find sentences containing keywords
    relevant_segments = []
    for sentence in sentences:
        sentence = sentence.strip()
        if sentence:
            sentence_lower = sentence.lower()
            keyword_count = sum(1 for keyword in keywords if keyword in sentence_lower)
            if keyword_count > 0:
                relevant_segments.append({
                    "text": sentence,
                    "relevance_score": keyword_count
                })
    
    # Sort by relevance score and take top 5
    relevant_segments.sort(key=lambda x: x["relevance_score"], reverse=True)
    return relevant_segments[:5]

@app.route('/api/upload', methods=['POST'])
def upload_document():
    """Endpoint to upload and process a document."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        # Create a unique ID for the document
        doc_id = str(uuid.uuid4())
        
        # Save the file temporarily
        filename = secure_filename(file.filename)
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        
        # Extract text based on file type
        if filename.lower().endswith('.pdf'):
            document_text = extract_text_from_pdf(file_path)
        elif filename.lower().endswith('.docx'):
            document_text = extract_text_from_docx(file_path)
        else:
            return jsonify({"error": "Unsupported file format"}), 400
        
        # Generate suggested questions
        questions_data = generate_questions(document_text)
        
        # Store document in memory
        documents[doc_id] = {
            "filename": filename,
            "text": document_text,
            "upload_time": time.time()
        }
        
        # Clean up temporary file
        os.remove(file_path)
        
        return jsonify({
            "doc_id": doc_id,
            "filename": filename,
            "suggested_questions": questions_data["questions"],
            "token_usage": questions_data["token_usage"],
            "processing_time": questions_data["processing_time"]
        })
    
    return jsonify({"error": "Invalid file format"}), 400

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """Endpoint to answer a question about a document."""
    data = request.json
    
    if not data or 'doc_id' not in data or 'question' not in data:
        return jsonify({"error": "Missing document ID or question"}), 400
    
    doc_id = data['doc_id']
    question = data['question']
    
    if doc_id not in documents:
        return jsonify({"error": "Document not found"}), 404
    
    document_text = documents[doc_id]["text"]
    answer_data = answer_question(document_text, question)
    
    return jsonify({
        "answer": answer_data["answer"],
        "relevant_segments": answer_data["relevant_segments"],
        "token_usage": answer_data["token_usage"],
        "processing_time": answer_data["processing_time"]
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "ok", "timestamp": time.time()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
