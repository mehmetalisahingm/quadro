# Q29 — q-018…q-023 temiz kör review handoff

> Takvim #41 kararıyla 2026-11-11 tabanına taşındı ([kayıt](../../../docs/CONTENT_RESERVATIONS.md#takvim-yeniden-planlaması-41)). Dosya bağlantıları güncellendi; metindeki tarihler kaydın yazıldığı günkü planı anlatır.

Bu dosya Q29'da kalan 6 adayın **çözüm metadata'sına bakmamış** bir reviewer/oturum tarafından incelenmesi içindir. Burada bilerek cevap dosyası, grup adı veya çözüm kelimeleri verilmez.

## Neden ayrı handoff var?

q-024…q-032 için 9 gerçek kör review tamamlandı. q-018…q-023 ise önceki PR kontrollerinde mevcut oturum tarafından çözüm metadata'sı görüldüğü için aynı oturumda tekrar “kör” sayılmaz.

## Reviewer kuralı

Reviewer aşağıdaki altı kör dosyadan başka puzzle/editorial çözüm dosyası açmadan çalışmaya başlamalıdır.

| Aday | Yalnız önce açılacak blind dosya | Reviewer | Tarih | Karar |
| --- | --- | --- | --- | --- |
| q-018 | `src/content/editorial/blind/2026-11-28.json` | — | — | BEKLİYOR |
| q-019 | `src/content/editorial/blind/2026-11-29.json` | — | — | BEKLİYOR |
| q-020 | `src/content/editorial/blind/2026-11-30.json` | — | — | BEKLİYOR |
| q-021 | `src/content/editorial/blind/2026-12-01.json` | — | — | BEKLİYOR |
| q-022 | `src/content/editorial/blind/2026-12-02.json` | — | — | BEKLİYOR |
| q-023 | `src/content/editorial/blind/2026-12-03.json` | — | — | BEKLİYOR |

## Sıra

Her aday için:

1. Yalnız blind JSON açılır.
2. 16 kelime üzerinden dört dörtlü çözülmeye çalışılır.
3. Denenen güçlü/yanıltıcı bağlantılar yazılır.
4. Olası ikinci tam çözüm, doğal Türkçe ve aşırı özel bilgi not edilir.
5. Kör çözüm kaydı tamamlandıktan **sonra** kanonik puzzle/editorial dosyası açılır.
6. Çözüm eşleşmesi ve açıklama kalitesi kontrol edilir.
7. `ONAY`, `REVİZYON` veya `RED` kararı revision ile kaydedilir.

Ayrıntılı kayıt biçimi `Q29_REVIEW_TEMPLATE.md`; mevcut 9/15 ilerleme `Q29_REVIEW_PROGRESS.md` dosyasındadır.

## Teslim

Temiz reviewer bu altı adayın sonuçlarını Q29 review tablosuna işler. Revizyon gereken aday varsa Utku düzeltir ve değişen aday yeniden temiz kör kontrolden geçer.

Bu handoff'un hazırlanması Q29'u tamamlamaz; kalan altı gerçek review kaydı olmadan issue açık kalır.
