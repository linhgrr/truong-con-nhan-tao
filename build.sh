#!/bin/bash

# Cài đặt các phụ thuộc Python
pip install -r requirements.txt

# Cài đặt lại huggingface_hub phiên bản cũ để tránh lỗi
pip install huggingface_hub==0.16.4

# Tạo thư mục cần thiết
mkdir -p data models/faiss_index

# Đảm bảo có file knowledge.txt rỗng nếu không tồn tại
touch data/knowledge.txt 