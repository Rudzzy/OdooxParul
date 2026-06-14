import sqlite3
conn = sqlite3.connect('cafe.db')
cursor = conn.cursor()

# Get order ids
cursor.execute("SELECT orderId FROM kds_orders WHERE ticketNumber IN ('101', '104')")
rows = cursor.fetchall()
order_ids = [r[0] for r in rows if r[0]]

# Delete KDS items
cursor.execute("DELETE FROM kds_order_items WHERE kdsOrderId IN (SELECT id FROM kds_orders WHERE ticketNumber IN ('101', '104'))")

# Delete KDS orders
cursor.execute("DELETE FROM kds_orders WHERE ticketNumber IN ('101', '104')")

# Delete POS orders
for oid in order_ids:
    cursor.execute("DELETE FROM orders WHERE id = ?", (oid,))

conn.commit()
print('Deleted successfully')
