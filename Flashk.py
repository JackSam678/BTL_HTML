from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import os
import logging
from werkzeug.exceptions import BadRequest

# 配置日志，过滤掉不影响使用的异常请求日志
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)  # 只显示错误级别以上的日志

app = Flask(__name__)
# 配置跨域，允许前端调用
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# 数据库配置 - 请根据实际环境修改
DB_CONFIG = {
    'host': 'localhost',
    'database': 'botler_robotics',
    'user': 'root',
    'password': '123456',  # 你的MySQL密码
    'port': '3306',
    'charset': 'utf8mb4',
    'connect_timeout': 10
}

def create_connection():
    """创建数据库连接"""
    connection = None
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"数据库连接错误: {str(e)}")
    return connection

# 根路径路由
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "success": True,
        "message": "苏州博特勒机器人有限公司API服务运行中",
        "api文档": {
            "GET /api/products": "获取产品列表",
            "POST /api/contact": "提交联系表单（需JSON格式：name,email,subject,message）"
        }
    })

# 处理网站图标请求，避免404错误
@app.route('/favicon.ico', methods=['GET'])
def favicon():
    return '', 204  # 无图标时返回空响应

# 获取产品列表接口
@app.route('/api/products', methods=['GET'])
def get_products():
    connection = create_connection()
    if not connection:
        return jsonify({"success": False, "message": "数据库连接失败"}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()
        return jsonify({
            "success": True,
            "count": len(products),
            "data": products
        })
    except Error as e:
        return jsonify({"success": False, "message": f"查询失败: {str(e)}"}), 500
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

# 联系表单提交接口
@app.route('/api/contact', methods=['POST'])
def contact():
    try:
        if not request.is_json:
            return jsonify({"success": False, "message": "请使用JSON格式提交"}), 400
        
        data = request.get_json()
        
        # 验证必填字段
        required = ['name', 'email', 'subject', 'message']
        missing = [f for f in required if f not in data or not data[f]]
        if missing:
            return jsonify({
                "success": False,
                "message": f"缺少必填信息: {', '.join(missing)}"
            }), 400
        
        # 验证邮箱格式
        if '@' not in data['email'] or '.' not in data['email'].split('@')[-1]:
            return jsonify({"success": False, "message": "请输入有效的邮箱地址"}), 400
        
        # 数据库操作
        connection = create_connection()
        if not connection:
            return jsonify({"success": False, "message": "数据库连接失败"}), 500
        
        cursor = connection.cursor()
        query = """
        INSERT INTO contact_messages 
        (name, email, subject, message, created_at)
        VALUES (%s, %s, %s, %s, NOW())
        """
        cursor.execute(query, (data['name'], data['email'], data['subject'], data['message']))
        connection.commit()
        return jsonify({"success": True, "message": "消息发送成功，我们将尽快回复您！"})
    
    except BadRequest:
        return jsonify({"success": False, "message": "请求格式错误"}), 400
    except Error as e:
        return jsonify({"success": False, "message": f"提交失败: {str(e)}"}), 500
    finally:
        if 'connection' in locals() and connection and connection.is_connected():
            cursor.close()
            connection.close()

# 全局异常处理
@app.errorhandler(400)
def bad_request(e):
    return jsonify({"success": False, "message": "请求格式不规范"}), 400

@app.errorhandler(404)
def not_found(e):
    return jsonify({"success": False, "message": "请求的接口不存在"}), 404

if __name__ == '__main__':
    # 修复端口配置错误，指定端口为5000
    app.run(
        debug=True,
        port=5001,  # 这里补充了端口值
        host='0.0.0.0',
        threaded=True
    )
