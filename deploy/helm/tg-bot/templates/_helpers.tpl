{{- define "tg-bot.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "tg-bot.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "tg-bot.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
