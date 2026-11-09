$baseUrl = "http://localhost:5000/api"
$passed = 0
$failed = 0

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "   ScamSense — Phase 2 Automated API Verification" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------
# Test 1: Health Check
# ------------------------------------------------------------
Write-Host "1. Testing Health Check (GET /health)..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    if ($health.success) {
        Write-Host " [PASS] Server is running!" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "Error: Could not reach server at $baseUrl. Make sure 'npm run dev' is running!" -ForegroundColor Red
    $failed++
    exit 1
}

# ------------------------------------------------------------
# Test 2: Public - List All Articles
# ------------------------------------------------------------
Write-Host "2. Testing Public Articles List (GET /articles)..." -NoNewline
try {
    $articles = Invoke-RestMethod -Uri "$baseUrl/articles" -Method Get
    if ($articles.success) {
        Write-Host " [PASS] Found $($articles.data.Count) articles" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $failed++
}

# ------------------------------------------------------------
# Test 3: Public - Category Filter
# ------------------------------------------------------------
Write-Host "3. Testing Category Filter (GET /articles?category=phishing)..." -NoNewline
try {
    $filtered = Invoke-RestMethod -Uri "$baseUrl/articles?category=phishing" -Method Get
    if ($filtered.success) {
        Write-Host " [PASS] Filter returned $($filtered.data.Count) matching articles" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $failed++
}

# ------------------------------------------------------------
# Test 4: Public - List All Quizzes
# ------------------------------------------------------------
Write-Host "4. Testing Public Quizzes List (GET /quizzes)..." -NoNewline
try {
    $quizzes = Invoke-RestMethod -Uri "$baseUrl/quizzes" -Method Get
    if ($quizzes.success) {
        Write-Host " [PASS] Found $($quizzes.data.Count) quizzes" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $failed++
}

# ------------------------------------------------------------
# Test 5: Anti-Cheat Verification (GET /quizzes/1)
# ------------------------------------------------------------
Write-Host "5. Testing Anti-Cheat Protection on Quiz 1..." -NoNewline
$quiz1Data = $null
try {
    $quiz1 = Invoke-RestMethod -Uri "$baseUrl/quizzes/1" -Method Get
    $quiz1Data = $quiz1.data
    $firstQuestion = $quiz1.data.questions[0]
    $firstOption = $firstQuestion.options[0]

    # Verify that is_correct and explanation are NOT returned to public users
    $leakedCorrect = ($firstOption | Get-Member -Name "is_correct") -ne $null
    $leakedExplanation = ($firstQuestion | Get-Member -Name "explanation") -ne $null

    if (-not $leakedCorrect -and -not $leakedExplanation) {
        Write-Host " [PASS] Anti-cheat verified (is_correct & explanation are hidden!)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [SECURITY WARNING] Answers or explanations were exposed!" -ForegroundColor Yellow
        $failed++
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $failed++
}

# ------------------------------------------------------------
# Test 6: Admin Login & Session Cookie
# ------------------------------------------------------------
Write-Host "6. Logging in as Admin (POST /auth/login)..." -NoNewline
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    $adminLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
        -Body (@{ email = "admin@scamsense.com"; password = "Admin@123" } | ConvertTo-Json) `
        -ContentType "application/json" -WebSession $adminSession

    if ($adminLogin.success -and $adminLogin.data.role -eq "admin") {
        Write-Host " [PASS] Logged in as $($adminLogin.data.role)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " [FAIL] Could not log in as admin. Check your DB seeds!" -ForegroundColor Red
    $failed++
}

# ------------------------------------------------------------
# Test 7: Admin View Quiz with Correct Answers
# ------------------------------------------------------------
Write-Host "7. Testing Admin Quiz Details (GET /quizzes/1/admin)..." -NoNewline
try {
    $adminQuiz = Invoke-RestMethod -Uri "$baseUrl/quizzes/1/admin" -Method Get -WebSession $adminSession
    $adminOption = $adminQuiz.data.questions[0].options[0]
    $hasCorrectFlag = ($adminOption | Get-Member -Name "is_correct") -ne $null

    if ($hasCorrectFlag) {
        Write-Host " [PASS] Admin view successfully includes is_correct flags for editing" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL] is_correct flag missing in admin view" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $failed++
}

# ------------------------------------------------------------
# Test 8: Regular User Login & Quiz Submission
# ------------------------------------------------------------
Write-Host "8. Logging in as Regular User (POST /auth/login)..." -NoNewline
$userSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    # If satyam user doesn't exist yet, register first
    try {
        Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post `
            -Body (@{ name = "Satyam"; email = "satyam@example.com"; password = "Test@123" } | ConvertTo-Json) `
            -ContentType "application/json" | Out-Null
    } catch {}

    $userLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
        -Body (@{ email = "satyam@example.com"; password = "Test@123" } | ConvertTo-Json) `
        -ContentType "application/json" -WebSession $userSession

    if ($userLogin.success) {
        Write-Host " [PASS] Logged in as $($userLogin.data.name)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $failed++
}

# ------------------------------------------------------------
# Test 9: Submitting Quiz Answers (Server-Side Grading)
# ------------------------------------------------------------
Write-Host "9. Submitting Quiz Answers (POST /quizzes/1/attempts)..." -NoNewline
try {
    # Dynamically build answers from Quiz 1's actual questions
    $submissionAnswers = @()
    if ($quiz1Data -and $quiz1Data.questions) {
        foreach ($q in $quiz1Data.questions) {
            $submissionAnswers += @{ questionId = $q.id; selectedOptionId = $q.options[0].id }
        }
    } else {
        $submissionAnswers = @(
            @{ questionId = 1; selectedOptionId = 2 },
            @{ questionId = 2; selectedOptionId = 6 },
            @{ questionId = 3; selectedOptionId = 10 }
        )
    }

    $submissionPayload = @{ answers = $submissionAnswers } | ConvertTo-Json

    $grading = Invoke-RestMethod -Uri "$baseUrl/quizzes/1/attempts" -Method Post `
        -Body $submissionPayload -ContentType "application/json" -WebSession $userSession

    if ($grading.success -and $grading.data.score -ne $null) {
        Write-Host " [PASS] Graded! Score: $($grading.data.score)/$($grading.data.totalQuestions) ($($grading.data.percentage)%)" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $failed++
}

# ------------------------------------------------------------
# Test 10: Fetch My Quiz Attempts
# ------------------------------------------------------------
Write-Host "10. Fetching User Quiz History (GET /quizzes/attempts/my)..." -NoNewline
try {
    $myAttempts = Invoke-RestMethod -Uri "$baseUrl/quizzes/attempts/my" -Method Get -WebSession $userSession
    if ($myAttempts.success) {
        Write-Host " [PASS] Retrieved $($myAttempts.data.Count) past attempts" -ForegroundColor Green
        $passed++
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    $failed++
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "   Phase 2 Test Summary: $passed Passed, $failed Failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "============================================================`n" -ForegroundColor Cyan

if ($failed -gt 0) {
    exit 1
} else {
    exit 0
}