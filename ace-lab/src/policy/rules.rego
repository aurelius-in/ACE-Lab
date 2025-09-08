package ace.policy

default allow := false

allow {
  not violation
}

violation[msg] {
  input.device == "mobile"
  input.width > 1920
  msg := "Export exceeds 1080p on mobile"
}


