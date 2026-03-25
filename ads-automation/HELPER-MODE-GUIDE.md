# 📖 Ads Template Helper - Hướng Dẫn Đầy Đủ

## 🎯 Tổng Quan

**Ứng dụng này là một HELPER TOOL, KHÔNG PHẢI AUTOMATION TOOL**

```
OLD: App tự tạo ads → Meta bans ❌
NEW: App tạo template → User publish thủ công → Safe ✅
```

---

## ✅ Tại Sao An Toàn?

1. **KHÔNG tạo campaigns trên Facebook**
   - App chỉ tạo file JSON template
   - User tự copy-paste vào Ads Manager

2. **KHÔNG gọi Facebook API**
   - Không POST `/campaigns`, `/adsets`, `/ads`
   - Meta KO phát hiện "automation"

3. **User Control 100%**
   - Mỗi bước người dùng phải thực hiện thủ công
   - Meta sees "human-created" → SAFE

4. **Có Audit Trail**
   - Tracking khi nào export, bao nhiêu templates
   - Compliance documentation

---

## 🚀 Cách Dùng (Từng Bước)

### **Bước 1: Mở Ứng Dụng**
```
Mở file: ads-automation-helper.html
(trong browser, hoặc host trên web server)
```

### **Bước 2: Upload Videos & Tạo Template**
1. Click "📝 Tạo Template"
2. Drag-drop videos (hoặc click chọn)
3. Edit headline & description cho mỗi video:
   ```
   📌 Headline: "Sản phẩm X giảm 50%"
   📝 Description: "Chỉ còn 100k, mua ngay khi có hàng"
   ```

### **Bước 3: Cấu Hình Campaign**
Điền thông tin:
- **📢 Campaign Name**: `MKT_Product_March`
- **🎯 Objective**: `Conversions (Bán hàng)`
- **🌍 Country**: `PH` (hoặc `VN, US, ...`)
- **💰 Budget**: `200000` (đ/campaign/ngày)
- **🔗 URL**: `https://shop.example.com/product`
- **📐 Pixel ID**: `123456789` (lấy từ Ads Manager)

### **Bước 4: Preview**
Click "👀 Preview Template"
- Template sẽ được lưu vào thư viện
- Video sẽ reset để tạo template mới

### **Bước 5: Export Template**
1. Vào tab "📤 Xuất & Đăng"
2. Check các templates cần export
3. Preview JSON
4. Click "📥 Download JSON File"
5. File sẽ lưu dưới tên: `ads-templates-2024-03-25.json`

### **Bước 6: Import & Publish (Trên Facebook Ads Manager)**
**ĐÂY LÀ BƯỚC QUAN TRỌNG - User tự thực hiện:**

1. Vào https://ads.facebook.com/
2. Click "Create"
3. Chọn objective (vd: Conversions)
4. Mở file JSON đã tải:
   ```json
   {
     "campaign_name": "MKT_Product_March",
     "objective": "OUTCOME_SALES",
     "budget_daily": 200000,
     "landing_url": "https://shop.example.com",
     "pixel_id": "123456789",
     "ads": [
       {
         "headline": "Sản phẩm X giảm 50%",
         "description": "Chỉ còn 100k, mua ngay"
       }
     ]
   }
   ```
5. Copy thông tin từ JSON → Paste vào Ads Manager
6. Review tất cả trước khi publish
7. Click "Publish" trong Ads Manager (User tự click, không phải app)

**KẾT QUẢ:**
- ✅ Ads được tạo bởi user (không phải app)
- ✅ Meta thấy "human action"
- ✅ SAFE - không vi phạm chính sách

---

## 📚 Thư Viện Templates

Tab "📚 Thư viện" cho phép:
- ✅ Xem tất cả templates đã tạo
- ✅ Xóa templates old
- ✅ Tái sử dụng templates

```
Nếu muốn export lại template→ Vào tab "Xuất", select template cũ, Export
```

---

## 🔒 Compliance & Security

### Audit Log
Tab "📊 Lịch sử" tracking:
- Khi nào export
- Bao nhiêu templates
- Timestamp chính xác

Dùng cho:
- ✅ Internal compliance review
- ✅ Team accountability
- ✅ Prove "not automated"

### Best Practices
1. **Review templates trước export**
   - Đảm bảo nội dung phù hợp
   - Kiểm tra legal compliance địa phương

2. **Collaborate với team**
   - Share JSON file với team
   - Let them review before publishing

3. **Maintain audit trail**
   - Check "Lịch sử" tab để verify
   - Keep records nếu Meta audit

4. **Follow Facebook Policies**
   - Không quảng cáo sản phẩm cấm
   - Không targeting minors
   - Không misleading copy

---

## ⚠️ Lưu Ý Quan Trọng

### ❌ KHÔNG NÊN
- ❌ Tự động publish (mặc dù ứng dụng không có quyền)
- ❌ Tạo ads cho sản phẩm cấm (cờ bạc, thuốc, vũ khí)
- ❌ Targeting trẻ em hoặc sensitive groups
- ❌ Misleading headlines/bait-and-switch

### ✅ NÊN
- ✅ Review tất cả templates trước export
- ✅ Let team review JSON before publish
- ✅ Keep files organized (campaign naming)
- ✅ Check audit log para accountability

---

## 🆘 Troubleshooting

### Q: JSON file quá lớn/lỗi?
**A:** Ứng dụng có giới hạn format. Xem preview trước export.

### Q: Làm sao import JSON vào Ads Manager?
**A:** Ads Manager KHÔNG tự động import JSON. User phải:
1. Mở JSON file (text editor)
2. Copy nội dung từng trường
3. Paste vào Ads Manager form

### Q: Pixel ID ở đâu?
**A:** Ads Manager → Settings → Data Sources → Pixels → [Pixel Name]

### Q: Có thể export lại template?
**A:** Có. Lưu trong thư viện, vào tab "Xuất", select template, export lại.

---

## 🎓 Học Thêm

### Facebook Policies
- https://www.facebook.com/policies/ads/
- https://www.facebook.com/policies/ads/prohibited-content/

### Ads Manager Tutorials
- https://www.facebook.com/business/learning/
- Official Facebook Ads Manager Guide

---

## 📞 Support

Nếu có issues:
1. Check audit log (lịch sử)
2. Xem templates library
3. Re-export nếu lỗi
4. Contact Meta support nếu error

---

## 📋 Checklist Trước Publish

- [ ] Checked & confirmed headlines
- [ ] Description accurate & compliant
- [ ] URL correct & landing page loads
- [ ] Pixel ID valid
- [ ] Budget reasonable
- [ ] Targeting correct (country, age, etc)
- [ ] Reviewed JSON file
- [ ] Team approved
- [ ] Ready to publish in Ads Manager

---

**Happy Advertising! 🚀 Stay Compliant, Stay Safe ✅**

*Ads Template Helper v1.0 — Policy Compliant Helper Tool*
