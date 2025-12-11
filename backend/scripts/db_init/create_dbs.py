import pymysql

def create_databases():
    try:
        # Connect to MySQL server (no database selected)
        conn = pymysql.connect(host='localhost', user='root', password='V3eH5oWu6cQUsJkmLqCrUjB7trWP6yGgK@33')
        cursor = conn.cursor()
        
        # Create databases
        cursor.execute("CREATE DATABASE IF NOT EXISTS sigma_db")
        cursor.execute("CREATE DATABASE IF NOT EXISTS oriente_data")
        
        print("Databases 'sigma_db' and 'oriente_data' checked/created.")
        
        conn.close()
    except Exception as e:
        print(f"Error creating databases: {e}")

if __name__ == "__main__":
    create_databases()
