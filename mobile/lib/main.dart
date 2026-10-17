import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:guajiranet_mobile/Aplicacion.dart';

void main() {
  runApp(
    const ProviderScope(
      child: Aplicacion(),
    ),
  );
}
