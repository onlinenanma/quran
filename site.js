<!DOCTYPE html>
<html lang="ml" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Qur'an Hifz Tracker - Malayalam Labels</title>
  <style>
    body { font-family: sans-serif; margin: 20px; background: #f9f9f9; color: #333; }
    h1 { color: #1e4d3a; }
    table { width: 100%; border-collapse: collapse; background: #fff; margin-top: 15px; }
    th, td { border: 1px solid #ddd; padding: 10px 15px; text-align: left; }
    th { background-color: #1e4d3a; color: white; }
    .ar { font-family: serif; direction: rtl; }
  </style>
</head>
<body>

  <h1>Qur'an Hifz Tracker - UI Labels</h1>
  <p>Here are the interface labels extracted from the page displayed with their Malayalam translations:</p>

  <table>
    <thead>
      <tr>
        <th>Original Label (Arabic / English)</th>
        <th>Malayalam Translation (മലയാളം)</th>
        <th>Description / Context</th>
      </tr>
    </thead>
    <tbody id="label-table-body">
      <!-- Populated dynamically via JavaScript -->
    </tbody>
  </table>

  <script>
    // Labels identified from hifd-2.html
    const pageLabels = [
      { original: "حفظ القرآن (Qur'an Hifz Tracker)", malayalam: "ഖുർആൻ ഹിഫ്ള് ട്രാക്കർ", context: "Main Title / Brand" },
      { original: "السورة (Surah)", malayalam: "സൂറത്ത്", context: "Surah Selector[cite: 1]" },
      { original: "من آية (From Verse)", malayalam: "ആദ്യം ആയത്ത് മുതൽ", context: "Starting Verse[cite: 1]" },
      { original: "إلى آية (To Verse)", malayalam: "അവസാന ആയത്ത് വരെ", context: "Ending Verse[cite: 1]" },
      { original: "التكرار (Repetition)", malayalam: "ആവർത്തനം", context: "Repetitions Section[cite: 1]" },
      { original: "الورد اليومي (Daily Wird)", malayalam: "ദൈനംദിന വര്ദ്", context: "Daily Wird Section[cite: 1]" },
      { original: "من صفحة (From Page)", malayalam: "പേജ് മുതൽ", context: "Wird Start Page[cite: 1]" },
      { original: "إلى صفحة (To Page)", malayalam: "പേജ് വരെ", context: "Wird End Page[cite: 1]" },
      { original: "الأسبوع (Week)", malayalam: "ആഴ്ച", context: "Week View / Sheet[cite: 1]" },
      { original: "ملاحظات الأسبوع (Week Notes)", malayalam: "ആഴ്ചയിലെ കുറിപ്പുകൾ", context: "Notes Section[cite: 1]" }
    ];

    const tableBody = document.getElementById('label-table-body');
    
    pageLabels.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="ar"><strong>${item.original}</strong></td>
        <td><strong>${item.malayalam}</strong></td>
        <td>${item.context}</td>
      `;
      tableBody.appendChild(tr);
    });
  </script>

</body>
</html>
