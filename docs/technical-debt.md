# Nợ kỹ thuật

Tài liệu ghi nhận các vấn đề đã biết của PMP Dashboard để xử lý sau. Việc ghi nhận không đồng nghĩa với phê duyệt triển khai phương án sửa.

## TD001 Chưa thống nhất phạm vi Uploaded Families giữa các trang

- Ngày ghi nhận: 04/10/2026.
- Trạng thái: Đã áp dụng giải pháp tạm theo quyết định người dùng 04/10/2026; chưa đóng phần xác minh tương đương nghiệp vụ.
- Phạm vi: Executive Overview, Issues, Productivity và bộ lọc liên quan.
- Mốc dữ liệu đã điều tra: 30/09/2026, không có bộ lọc.

### Cập nhật triển khai tạm 04/10/2026

Người dùng chấp thuận coi toàn bộ ánh xạ trong `Annotation_RFA_equivalence_Checked.xlsx` là tương đương với TIDP, kể cả proposed và accepted temporary. Áp dụng nguyên bản (Git blob `8c9bc55511f3f5f107a5923739d65361aec7fa15`), không tự sửa đích Ticket 72176 theo đề xuất rà soát. Ba workbook chính không thay đổi. Trạng thái/độ tin cậy nguồn được giữ riêng với quyết định áp dụng tạm.

Baseline sau tái tạo: 2.295 tên TIDP = 2.001 upload khớp (87,2%) + 294 chưa có liên kết upload. Có thêm 68 liên kết tương đương; không tạo thêm Family hay ticket. MIDP Actual, đường tích lũy và forecast dùng cùng familyId với donut và bộ lọc. Issues/Productivity vẫn đếm 2.001 uploaded, 1.500 One pass và 501 Returned; Ticket_IDs và giờ thực giữ nguyên.

Nợ còn lại: xác minh nghiệp vụ các alias, nhất là 12 trường hợp cần xác nhận và ánh xạ Ticket 72176 đã nêu trong rà soát. Tổng upload và coverage TIDP vẫn là hai định nghĩa khác nhau; bằng nhau ở snapshot này không bảo đảm sẽ bằng nhau khi nguồn mở rộng. Không xem chấp thuận tạm là xác minh mô hình, hoàn tất ticket hay approval Family. Các số và kế hoạch dưới đây là hồ sơ điều tra trước khi áp dụng ngoại lệ tạm.

### Hiện trạng trước giải pháp tạm

Overview hiển thị 1.933 Family uploaded, trong khi Issues và Productivity hiển thị 2.001. Hai số dùng phạm vi khác nhau nhưng dễ được hiểu là cùng một chỉ tiêu. Điều này gây nhầm lẫn khi so sánh số lượng, tỷ lệ hoàn thành và kết quả lọc giữa các trang.

| Tập dữ liệu | Số Family duy nhất |
| --- | ---: |
| Family trong TIDP thuộc Revise the RFA library | 2.295 |
| Family upload khớp tên với TIDP | 1.933 |
| Toàn bộ Family đã upload thuộc dự án | 2.001 |
| Đã upload nhưng chưa khớp TIDP | 68 |
| Family trong TIDP chưa có bản ghi upload khớp tên | 362 |

Đối soát: 2.001 = 1.933 + 68; 2.295 = 1.933 + 362. Trong 68 Family chưa khớp có 41 One pass và 27 Returned.

### Nguyên nhân đã xác định

Overview bắt đầu từ TIDP và đếm tên Family chuẩn hóa có `familyId` khớp nguồn upload. Issues và Productivity bắt đầu từ toàn bộ Family của dự án, loại trùng và yêu cầu End Date hợp lệ không vượt snapshot; không yêu cầu khớp TIDP.

Khi tách Issues và Productivity, phạm vi hai trang được chuyển sang toàn bộ Family đã upload, nhưng Overview giữ logic TIDP cũ. Chưa có định nghĩa và hàm tính chung cho chỉ tiêu tổng upload.

Phép nối hiện tại chỉ khớp tên sau khi bỏ đuôi `.rfa`, bỏ ký tự ngoài a–z/0–9 và chuyển thành chữ thường. Khác mã hoặc khác tên có thể làm mất liên kết. Có 6 ứng viên chỉ khác tiền tố ba chữ số sau chuẩn hóa, nhưng chưa được xác nhận là cùng Family. Ví dụ: `400_NF_GussetPlateAngularRectangular` trong nguồn upload và `491_NF_GussetPlateAngularRectangular` trong TIDP.

Không được kết luận 68 Family đều ngoài kế hoạch hoặc 362 Family chắc chắn chưa upload. Đây là các tập chưa khớp theo quy tắc nối hiện tại.

Kiểm tra ở mốc điều tra cho thấy 0 tên Family chuẩn hóa bị trùng, 0 End Date thiếu/không hợp lệ và 0 End Date vượt snapshot trong nguồn Family của dự án. Có 42 bản ghi thuộc dự án khác đã được loại khỏi 2.043 dòng nguồn, còn 2.001 dòng. Các yếu tố này không tạo ra chênh lệch 68.

### Kế hoạch sửa đề xuất

1. Dùng một định nghĩa và hàm chọn dữ liệu chung cho tổng Uploaded Families trên cả ba trang: Family của `DCMvn_Annotation Project`, loại trùng, cùng snapshot và cùng bộ lọc.
2. Tách tổng upload khỏi chỉ tiêu đối chiếu TIDP. Giữ riêng các tập upload khớp TIDP, upload chưa khớp TIDP và TIDP chưa khớp upload.
3. Đổi nhãn `Not uploaded` thành `No upload match` ở biểu đồ đối chiếu tên, tránh khẳng định vượt bằng chứng.
4. Rà soát 68 bản ghi; phân biệt đổi tên/mã, chưa có trong TIDP và chưa xác định. Chỉ bổ sung ánh xạ sau khi được xác nhận; không tự động nối gần đúng hoặc sửa workbook nguồn.
5. Tách bộ lọc tổng upload khỏi bộ lọc upload khớp TIDP. Hiện chọn Uploaded trên Overview còn giới hạn ngầm sang tập khớp TIDP khi chuyển trang.
6. Kiểm thử số tổng, thành phần, danh sách chi tiết, bộ lọc kết hợp, chuyển trang và Reset Filters.

Không thay trực tiếp 1.933 bằng 2.001 trong donut kế hoạch có mẫu số 2.295: 68 Family chưa khớp không được tự động tính là hoàn thành kế hoạch TIDP.

### Tiêu chí đóng nợ

- Cùng phạm vi và bộ lọc thì tổng Uploaded Families trên ba trang bằng nhau; baseline hiện tại là 2.001.
- Chỉ tiêu kế hoạch và tổng upload có nhãn, mẫu số và nguồn rõ ràng, không bị trộn.
- Tổng nhóm khớp và chưa khớp đối soát được, không chồng lặp; số KPI khớp danh sách chi tiết.
- Các ánh xạ mới có bằng chứng và xác nhận; không tự làm biến mất bản ghi chưa khớp.
- Bộ lọc và Reset Filters nhất quán giữa các trang; kiểm thử và tài liệu được cập nhật.
- Các số baseline phải được đối chiếu lại nếu nguồn thay đổi trước khi triển khai.

### Nguồn và vị trí logic

- Nguồn kế hoạch: `RawSource/DCMvn_TIDP_Combined_20260930.xlsx`, sheet `TIDP_Combined`.
- Nguồn upload: `RawSource/Family_Upload_vs_Annotation_Tickets_Checked.xlsx`, sheet `Family_vs_Tickets`, lọc Project Name = `DCMvn_Annotation Project`.
- `scripts/build_dashboard_data.py`: `normalize_family_name` và phép nối TIDP với Family.
- `src/app.js`: `overviewView`, `filtered`, `familyAnalysisView` và chi tiết donut.
- `src/family-outcomes.js`: `uploadedFamilyRows`, `uploadedFamilyCohort`, `familyProductivity`.

Hồ sơ ban đầu chỉ ghi nhận nợ kỹ thuật. Giải pháp tạm đã được triển khai theo cập nhật 04/10/2026 ở trên; ba nguồn dữ liệu chính không thay đổi.
